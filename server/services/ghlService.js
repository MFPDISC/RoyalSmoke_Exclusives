const axios = require('axios');

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const API_BASE = 'https://services.leadconnectorhq.com';

const headers = {
  'Authorization': `Bearer ${GHL_API_KEY}`,
  'Version': '2021-07-28',
  'Content-Type': 'application/json'
};

/**
 * Helper: Handle Axios Errors
 */
function handleAxiosError(context, error) {
  const msg = error.response?.data?.message || error.message;
  console.error(`[GHL] ${context} error:`, msg);
  // Useful for debugging full response
  if (error.response?.data) {
    console.error(`[GHL] Full error details:`, JSON.stringify(error.response.data));
  }
  return null;
}

/**
 * Lookup contact by email or phone
 * Returns contact object or null
 */
async function lookupContact(email, phone) {
  if (!email && !phone) return null;

  try {
    let query = '';
    if (email) query = `query=${encodeURIComponent(email)}`;
    else if (phone) query = `query=${encodeURIComponent(phone)}`;

    const response = await axios.get(`${API_BASE}/v1/contacts/?locationId=${GHL_LOCATION_ID}&${query}`, { headers });
    const contacts = response.data.contacts || [];

    // Exact match check
    const match = contacts.find(c =>
      (email && c.email && c.email.toLowerCase() === email.toLowerCase()) ||
      (phone && c.phone === phone)
    );

    return match || null;
  } catch (error) {
    return handleAxiosError('Lookup Contact', error);
  }
}

/**
 * Create or Update a contact in GHL
 * Returns contact ID
 */
async function createContact(email, name, phone, dob) {
  const data = {
    locationId: GHL_LOCATION_ID,
    name: name,
    email: email,
    phone: phone || '',
    dateOfBirth: dob || null,
    tags: ['RoyalSmoke-Contact']
  };

  try {
    const response = await axios.post(`${API_BASE}/v1/contacts/`, data, { headers });
    return response.data.contact.id;
  } catch (error) {
    // Check if error is due to duplicate (usually 422 or 400 with specific message)
    // GHL/LeadConnector often returns meaningful error messages
    const errorMsg = error.response?.data?.message || '';
    if (error.response?.status === 422 || errorMsg.includes('exists')) {
      console.log(`[GHL] Contact exists, attempting lookup...`);
      const existing = await lookupContact(email, phone);
      if (existing) {
        console.log(`[GHL] Found existing contact: ${existing.id}`);
        return existing.id;
      }
    }

    console.error('Error creating GHL contact:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create an invoice in GHL
 */
async function createInvoice(contactId, items, total, orderId) {
  const invoiceItems = items.map(item => ({
    name: item.name,
    price: Math.round(item.price_zar * 100), // Convert ZAR to cents
    quantity: item.quantity || 1
  }));

  const data = {
    locationId: GHL_LOCATION_ID,
    contactId: contactId,
    items: invoiceItems,
    total: Math.round(total * 100), // Total in cents
    title: `RoyalSmoke Order ${orderId}`,
    description: 'Premium cigar purchase'
  };

  try {
    const response = await axios.post(`${API_BASE}/v1/contacts/${contactId}/invoices`, data, { headers });
    return response.data.invoice;
  } catch (error) {
    console.error('Error creating GHL invoice:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create payment URL via GHL invoice
 */
const createPayment = async (orderData) => {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.log('[GHL] Credentials not configured');
    return null;
  }

  const {
    orderId,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    items = []
  } = orderData;

  try {
    // Create or get contact
    const contactId = await createContact(customerEmail, customerName, customerPhone);
    if (!contactId) throw new Error('Could not create/find contact');

    // Create invoice
    const invoice = await createInvoice(contactId, items, amount, orderId);

    // Return payment URL
    const paymentUrl = invoice.paymentLink || invoice.url;
    if (!paymentUrl) {
      console.error('[GHL] No payment URL in invoice');
      return null;
    }

    return {
      url: paymentUrl,
      data: {} // No form data needed
    };
  } catch (error) {
    console.error('[GHL] Payment creation failed:', error);
    return null;
  }
};

/**
 * Update contact with tags
 */
async function addTagsToContact(contactId, tags) {
  try {
    await axios.post(`${API_BASE}/v1/contacts/${contactId}/tags`, {
      tags: Array.isArray(tags) ? tags : [tags]
    }, { headers });
    return true;
  } catch (error) {
    console.error('Error adding tags to contact:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Update contact with order information
 */
async function updateContactWithOrder(contactId, orderData) {
  try {
    const customFields = {
      last_order_id: orderData.id,
      last_order_date: new Date().toISOString(),
      last_order_amount: `R${orderData.total_amount}`,
      total_orders: orderData.order_count || 1
    };

    // Note: 'customFields' update structure might vary based on custom field IDs availability
    // Standard fields are easier. Custom fields usually need their specific hash ID (e.g. "Mgob...").
    // If you don't have the map of IDs, this PUT might be ignored for custom fields.
    // For now we attempt it, but rely on tags.

    await axios.put(`${API_BASE}/v1/contacts/${contactId}`, {
      customFields: [] // TODO: Map fields if IDs are known
    }, { headers });

    // Add order status tag
    await addTagsToContact(contactId, [`Order-${orderData.status}`, 'Source-Website']);

    return true;
  } catch (error) {
    console.error('Error updating contact with order:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Sync new customer registration to GHL
 */
async function syncCustomerToGHL(customerData) {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.log('[GHL] Credentials not configured, skipping sync');
    return null;
  }

  try {
    const { name, email, phone, address, postal_code, dob } = customerData;

    const contactId = await createContact(email, name, phone, dob);

    // Add customer tags
    await addTagsToContact(contactId, ['RoyalSmoke-Customer', 'New-Registration']);

    // Update with address if provided
    if (address) {
      try {
        await axios.put(`${API_BASE}/v1/contacts/${contactId}`, {
          address1: address,
          postalCode: postal_code || ''
        }, { headers });
      } catch (addrErr) {
        console.warn('[GHL] Could not update address:', addrErr.message);
      }
    }

    console.log(`[GHL] Customer synced successfully: ${email || phone} (${contactId})`);
    return contactId;
  } catch (error) {
    console.error('[GHL] Failed to sync customer:', error);
    return null; // Don't block registration if GHL fails
  }
}

/**
 * Sync order to GHL contact
 */
async function syncOrderToGHL(order, customer) {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    return false;
  }

  // Ensure we have a GHL Contact ID
  let contactId = customer.ghl_contact_id;
  if (!contactId) {
    console.log(`[GHL] No ID for customer ${customer.id}, attempting sync...`);
    contactId = await syncCustomerToGHL(customer);
  }

  if (!contactId) return false;

  try {
    await updateContactWithOrder(contactId, {
      id: order.id,
      status: order.status,
      total_amount: order.total_amount,
      order_count: customer.order_count || 1
    });

    // Tag as first purchase if applicable
    if (customer.order_count === 1) {
      await addTagsToContact(contactId, 'First-Purchase');
    }

    console.log(`[GHL] Order ${order.id} synced to contact ${contactId}`);
    return true;
  } catch (error) {
    console.error('[GHL] Failed to sync order:', error);
    return false;
  }
}

/**
 * Sync Product to GHL (v2)
 */
async function syncProductToGHL(product) {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.log('[GHL] Credentials not configured, skipping product sync');
    return null;
  }

  // 1. Create or Update Product
  let ghlProductId = product.ghl_product_id;

  try {
    const productData = {
      name: product.name,
      description: product.description || '',
      productType: 'PHYSICAL', // Default to physical
      image: product.image_url || '',
      availableInStore: true,
      locationId: GHL_LOCATION_ID
    };

    if (ghlProductId) {
      // Update existing
      try {
        await axios.put(`${API_BASE}/products/${ghlProductId}`, productData, { headers });
        console.log(`[GHL] Updated product: ${product.name} (${ghlProductId})`);
      } catch (err) {
        if (err.response?.status === 404) {
          ghlProductId = null; // Re-create if not found
        } else {
          throw err;
        }
      }
    }

    if (!ghlProductId) {
      // Search by name logic could go here, but for now we create new
      // (To avoid duplicates, we'd need to list products and filter by name)
      const search = await axios.get(`${API_BASE}/products/?locationId=${GHL_LOCATION_ID}&limit=100`, { headers });
      const existing = search.data.products?.find(p => p.name === product.name);

      if (existing) {
        ghlProductId = existing._id;
        // Update it to match our data
        await axios.put(`${API_BASE}/products/${ghlProductId}`, productData, { headers });
        console.log(`[GHL] Found and updated existing product: ${product.name} (${ghlProductId})`);
      } else {
        // Create new
        const res = await axios.post(`${API_BASE}/products/`, productData, { headers });
        ghlProductId = res.data.product?._id || res.data._id; // API response structure varies
        console.log(`[GHL] Created new product: ${product.name} (${ghlProductId})`);
      }
    }

    // 2. Handle Price (One-time price)
    // fetch all prices for this location and filter by product, or use product specific endpoint if confirmed
    // Try fetching product again - sometimes it includes prices
    // But safer to create price if we are sure.

    // We will skip checking for now and just create if we don't have a ghl_price_id stored.
    let ghlPriceId = product.ghl_price_id;

    if (!ghlPriceId) {
      // Check if price exists by listing (if possible) or just create a new one.
      // Avoiding duplicates: Use a specific name "Standard Price" and check if it exists?
      // GHL Price API: GET /products/:productId/price (singular 'price' might be it?)
      // Let's try to just create it. If it exists, GHL might allow multiple prices.

      try {
        // First try to list prices to avoid creating duplicate
        // Try singular 'price'
        const pricesRes = await axios.get(`${API_BASE}/products/${ghlProductId}/price`, { headers });
        const prices = pricesRes.data.prices || [];
        const targetAmount = Math.round(product.price_zar);

        const existing = prices.find(p => p.amount === targetAmount);
        if (existing) {
          ghlPriceId = existing._id;
        }
      } catch (ignored) {
        // If GET fails, we proceed to create
      }

      if (!ghlPriceId) {
        const ticketName = product.name + ' Price';
        const priceData = {
          name: ticketName,
          product: ghlProductId,
          type: 'one_time',
          amount: Math.round(product.price_zar),
          currency: 'ZAR',
          locationId: GHL_LOCATION_ID
        };

        try {
          // Trying plural
          const pRes = await axios.post(`${API_BASE}/products/${ghlProductId}/prices`, priceData, { headers });
          ghlPriceId = pRes.data.price?._id || pRes.data._id;
        } catch (postErr) {
          // If plural fails, try singular? No, likely endpoint is /products/:id/price
          try {
            const pRes = await axios.post(`${API_BASE}/products/${ghlProductId}/price`, priceData, { headers });
            ghlPriceId = pRes.data.price?._id || pRes.data._id;
          } catch (finalErr) {
            console.error('[GHL] Price creation failed on both endpoints:', finalErr.response?.data || finalErr.message);
            if (finalErr.response?.status === 404) {
              // Last resort: Global prices endpoint
              try {
                const globalRes = await axios.post(`${API_BASE}/prices`, { ...priceData, productId: ghlProductId }, { headers });
                ghlPriceId = globalRes.data.price?._id || globalRes.data._id;
              } catch (ignored) { }
            }
          }
        }
      }

      if (ghlPriceId) {
        console.log(`[GHL] Price sync success: R${product.price_zar} (${ghlPriceId})`);
      }
    }

    return { ghlProductId, ghlPriceId };

    return { ghlProductId, ghlPriceId };

  } catch (error) {
    console.error('[GHL] Product sync failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Send order confirmation webhook to GHL
 * Triggers SMS automation for order confirmation
 */
async function sendOrderConfirmationWebhook(contactId, orderData) {
  if (!contactId) return false;

  try {
    // Add "order_paid" tag to trigger SMS workflow
    await addTagsToContact(contactId, ['order_paid', 'Order-Confirmed']);

    // Update contact with order details for personalization
    await axios.put(`${API_BASE}/v1/contacts/${contactId}`, {
      customField: {
        last_order_id: orderData.orderId.toString(),
        last_order_total: `R${orderData.total}`,
        last_order_eta: orderData.eta || '30-45 min'
      }
    }, { headers });

    console.log(`[GHL] Order confirmation webhook sent for order ${orderData.orderId}`);
    return true;
  } catch (error) {
    console.error('[GHL] Failed to send order confirmation webhook:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Send abandoned cart webhook to GHL
 * Triggers SMS automation for cart recovery
 */
async function sendAbandonedCartWebhook(contactId, cartData) {
  if (!contactId) return false;

  try {
    // Add "cart_abandoned" tag to trigger SMS workflow
    await addTagsToContact(contactId, ['cart_abandoned', 'Checkout-Started']);

    // Update contact with cart details for personalization
    await axios.put(`${API_BASE}/v1/contacts/${contactId}`, {
      customField: {
        abandoned_cart_total: `R${cartData.total}`,
        abandoned_cart_items: cartData.itemCount.toString(),
        abandoned_cart_timestamp: new Date().toISOString()
      }
    }, { headers });

    console.log(`[GHL] Abandoned cart webhook sent for contact ${contactId}`);
    return true;
  } catch (error) {
    console.error('[GHL] Failed to send abandoned cart webhook:', error.response?.data || error.message);
    return false;
  }
}

module.exports = {
  createPayment,
  syncCustomerToGHL,
  syncOrderToGHL,
  addTagsToContact,
  syncProductToGHL,
  sendOrderConfirmationWebhook,
  sendAbandonedCartWebhook
};
