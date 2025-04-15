import { useEffect, useState } from "react";

const DateTimeCard = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const istDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const day = istDate.getDate();
  const month = istDate.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = istDate.getFullYear();
  const weekday = istDate.toLocaleString("en-US", { weekday: "long" }).toUpperCase();

  const [time, meridiem] = istDate
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .split(" ");

  return (
    <div className="h-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-xl p-6 shadow-lg flex flex-col justify-between">
      <div className="flex justify-between items-center">
        {/* Date Info */}
        <div className="pr-6 border-r border-white/20">
          <div className="flex items-baseline mb-1">
            <p className="text-3xl font-bold mr-2">{day}</p>
            <p className="text-sm font-medium text-blue-200">{month}</p>
          </div>
          <p className="text-sm text-blue-200 font-medium tracking-wider uppercase">
            {weekday}
          </p>
          <p className="text-xs text-blue-200/80 font-medium">{year}</p>
        </div>

        {/* Time Info */}
        <div className="pl-6 flex flex-col items-end justify-center text-right">
          <div className="text-3xl font-bold font-mono tracking-wide leading-none">
            {time}
            <span className="text-sm text-blue-200 ml-1 align-top">{meridiem}</span>
          </div>
          <div className="flex items-center mt-1 text-xs text-blue-200">
            <i className="fas fa-globe-asia mr-1.5 text-blue-300 text-xs" />
            IST (GMT+5:30)
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTimeCard;
