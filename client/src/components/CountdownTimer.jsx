import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="inline-flex items-center gap-2 md:gap-3 bg-dark-800 border border-purple-500/30 rounded-lg md:rounded-xl px-3 py-2 md:px-6 md:py-3">
            <Clock className="text-purple-400 hidden md:block" size={20} />
            <Clock className="text-purple-400 md:hidden" size={16} />
            <div className="flex items-center gap-1.5 md:gap-2">
                <span className="text-gray-400 text-xs md:text-sm">Next Drop:</span>
                <div className="flex gap-1 md:gap-2">
                    {timeLeft.days > 0 && (
                        <div className="bg-purple-900/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                            <span className="text-purple-300 font-bold text-sm md:text-lg">{timeLeft.days}</span>
                            <span className="text-purple-500 text-[10px] md:text-xs ml-0.5 md:ml-1">d</span>
                        </div>
                    )}
                    <div className="bg-purple-900/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                        <span className="text-purple-300 font-bold text-sm md:text-lg">{String(timeLeft.hours).padStart(2, '0')}</span>
                        <span className="text-purple-500 text-[10px] md:text-xs ml-0.5 md:ml-1">h</span>
                    </div>
                    <div className="bg-purple-900/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                        <span className="text-purple-300 font-bold text-sm md:text-lg">{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <span className="text-purple-500 text-[10px] md:text-xs ml-0.5 md:ml-1">m</span>
                    </div>
                    <div className="bg-purple-900/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                        <span className="text-purple-300 font-bold text-sm md:text-lg">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        <span className="text-purple-500 text-[10px] md:text-xs ml-0.5 md:ml-1">s</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CountdownTimer;
