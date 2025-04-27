import { useEffect, useState } from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chart from "react-apexcharts";
import ButtonGroup from "@mui/material/ButtonGroup";

function EthereumPriceChart() {
  const [ethPrice, setEthPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [timeframe, setTimeframe] = useState("7d");
  const [isChartLoading, setIsChartLoading] = useState(false);

  const fetchPriceHistory = async (selectedTimeframe) => {
    setIsChartLoading(true);
    try {
      const days =
        selectedTimeframe === "1d"
          ? "1"
          : selectedTimeframe === "7d"
          ? "7"
          : selectedTimeframe === "30d"
          ? "30"
          : "90";

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=${days}`
      );
      const data = await response.json();

      let processedPrices = data.prices;

      if (selectedTimeframe === "30d" || selectedTimeframe === "90d") {
        const nth = selectedTimeframe === "30d" ? 4 : 12;
        processedPrices = data.prices.filter((_, index) => index % nth === 0);
      }

      const prices = processedPrices.map((price) => ({
        x: new Date(price[0]),
        y: price[1],
      }));

      setPriceHistory(prices);
    } catch (error) {
      console.error("Error fetching price history:", error);
    } finally {
      setIsChartLoading(false);
    }
  };

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true"
        );
        const data = await response.json();
        setEthPrice(data.ethereum);
      } catch (error) {
        console.error("Error fetching ETH price:", error);
      }
    };

    fetchEthPrice();
    fetchPriceHistory(timeframe);

    const interval = setInterval(fetchEthPrice, 60000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const handleTimeframeChange = (newTimeframe) => {
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe);
    }
  };

  const chartOptions = {
    chart: {
      type: "area",
      height: 200,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    colors: ["#17c1e8"],
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2,
      lineCap: "round",
    },
    grid: {
      show: true,
      borderColor: "#f1f1f1",
      strokeDashArray: 3,
      position: "back",
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        show: true,
        format: timeframe === "1d" ? "HH:mm" : "dd MMM",
        style: {
          colors: "#777",
          fontSize: "10px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      show: true,
      labels: {
        show: true,
        formatter: function (val) {
          return "$" + val.toFixed(0);
        },
        style: {
          colors: "#777",
          fontSize: "10px",
        },
      },
      tickAmount: 5,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      },
    },
    tooltip: {
      x: { format: timeframe === "1d" ? "HH:mm" : "dd MMM yyyy" },
      y: {
        formatter: function (val) {
          return "$" + val.toFixed(2);
        },
      },
      theme: "light",
      marker: {
        show: true,
      },
    },
    markers: {
      size: 0,
      hover: {
        size: 5,
        sizeOffset: 3,
      },
    },
  };

  const chartSeries = [
    {
      name: "ETH Price",
      data: priceHistory,
    },
  ];

  return (
    <Card sx={{ overflow: "hidden", width: "100%", maxWidth: "100%", length: "80%" }}>
      <SoftBox p={2}>
        <SoftBox mb={2}>
          <SoftTypography variant="h5" fontWeight="medium" mb={1}>
            Ethereum Price
          </SoftTypography>
          {ethPrice ? (
            <>
              <SoftTypography variant="h3" fontWeight="bold">
                ${ethPrice.usd.toFixed(2)}
              </SoftTypography>
              <SoftTypography
                variant="body2"
                color={ethPrice.usd_24h_change >= 0 ? "success" : "error"}
                fontWeight="medium"
              >
                {ethPrice.usd_24h_change >= 0 ? "+" : ""}
                {ethPrice.usd_24h_change.toFixed(2)}% (24h)
              </SoftTypography>
            </>
          ) : (
            <SoftTypography variant="body2">Loading...</SoftTypography>
          )}
        </SoftBox>
        <SoftBox width="100%" pl={1}>
          {isChartLoading ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" height="250px">
              <SoftTypography variant="body2">Loading chart...</SoftTypography>
            </SoftBox>
          ) : (
            <Chart options={chartOptions} series={chartSeries} type="area" height={250} />
          )}
        </SoftBox>
        <SoftBox display="flex" justifyContent="center" mt={2}>
          <ButtonGroup size="small" aria-label="timeframe selection">
            <SoftButton
              variant={timeframe === "1d" ? "contained" : "outlined"}
              color="info"
              size="small"
              onClick={() => handleTimeframeChange("1d")}
            >
              1D
            </SoftButton>
            <SoftButton
              variant={timeframe === "7d" ? "contained" : "outlined"}
              color="info"
              size="small"
              onClick={() => handleTimeframeChange("7d")}
            >
              1W
            </SoftButton>
            <SoftButton
              variant={timeframe === "30d" ? "contained" : "outlined"}
              color="info"
              size="small"
              onClick={() => handleTimeframeChange("30d")}
            >
              1M
            </SoftButton>
            <SoftButton
              variant={timeframe === "90d" ? "contained" : "outlined"}
              color="info"
              size="small"
              onClick={() => handleTimeframeChange("90d")}
            >
              3M
            </SoftButton>
          </ButtonGroup>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

export default EthereumPriceChart;
