import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftProgress from "components/SoftProgress";
import { formatDistanceToNow } from "date-fns";

function RepaymentCountdown({ timestamp, creationTimestamp, label = "Repay within" }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [percentRemaining, setPercentRemaining] = useState(100);
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    const deadline = new Date(Number(timestamp) * 1000);
    const creationTime = new Date(Number(creationTimestamp) * 1000);
    const now = new Date();
    
    if (deadline <= now) {
      setTimeLeft("Expired");
      setPercentRemaining(0);
      setIsExpired(true);
      return;
    }
    
    const totalDuration = deadline - creationTime;
    
    const updateCountdown = () => {
      const currentTime = new Date();
      const remaining = deadline - currentTime;
      
      if (remaining <= 0) {
        setTimeLeft("Expired");
        setPercentRemaining(0);
        setIsExpired(true);
        return;
      }
      
      const timeLeftFormatted = formatDistanceToNow(deadline, { addSuffix: false });
      setTimeLeft(timeLeftFormatted);
      
      const percentLeft = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
      setPercentRemaining(Math.round(percentLeft));
    };
    
    updateCountdown();
    
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [timestamp, creationTimestamp]);
  
  const getColorByPercentage = () => {
    if (isExpired) return "error";
    if (percentRemaining < 25) return "error";
    if (percentRemaining < 50) return "warning";
    return "success";
  };
  
  return (
    <SoftBox width="100%" mb={1}>
      <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
        <SoftTypography variant="caption" color="text">
          {label}
        </SoftTypography>
        <SoftTypography 
          variant="caption" 
          color={isExpired ? "error" : "dark"}
          fontWeight={isExpired ? "bold" : "medium"}
        >
          {timeLeft}
        </SoftTypography>
      </SoftBox>
      <SoftProgress
        variant="contained"
        value={percentRemaining}
        color={getColorByPercentage()}
        label={false}
      />
    </SoftBox>
  );
}

RepaymentCountdown.propTypes = {
  timestamp: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  creationTimestamp: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string,
};

export default RepaymentCountdown;