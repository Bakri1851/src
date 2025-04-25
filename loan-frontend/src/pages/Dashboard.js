import { useEffect, useRef, useState } from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftBadge from "components/SoftBadge";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Chart from "react-apexcharts";
import ButtonGroup from "@mui/material/ButtonGroup";
import useOpenAI from "hooks/useOpenAI";
import ReactMarkdown from "react-markdown";

export default function Dashboard() {
  const { isConnected } = useAccount();

  const [aiChat, setAiChat] = useState([]);
  const [aiMessage, setAiMessage] = useState("");

  const [ethPrice, setEthPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);

  const { askLoanQuestion, isLoading: aiIsLoading } = useOpenAI();

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

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;

    const userMessage = aiMessage;
    setAiChat((prev) => [...prev, { role: "user", content: userMessage }]);
    setAiMessage("");

    try {
      setAiChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Thinking...",
          isLoading: true,
        },
      ]);

      const response = await askLoanQuestion(userMessage);

      setAiChat((prev) => [
        ...prev.filter((msg) => !msg.isLoading),
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("Error getting AI response:", error);

      setAiChat((prev) => [
        ...prev.filter((msg) => !msg.isLoading),
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
        },
      ]);
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
    <Grid
      container
      spacing={3}
      justifyContent="space-between"
      alignItems="flex-start"
      minHeight="100vh"
    >
      {/* Left sidebar space compensation */}
      <Grid
        item
        xs={0}
        sm={1}
        md={1}
        lg={1}
        xl={2}
        sx={{ display: { xs: "none", sm: "block" } }}
      ></Grid>

      {/* Main content area */}
      <Grid
        item
        xs={12}
        sm={10}
        md={7}
        lg={6}
        xl={6}
        sx={{ display: "flex", justifyContent: "center" }}
      >
        <SoftBox
          p={3}
          mt={5}
          borderRadius="xl"
          boxShadow="lg"
          backgroundColor="white"
          width="100%"
          maxWidth="1000px"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <SoftTypography variant="h4">Loan Dashboard</SoftTypography>

          {!isConnected && (
            <SoftTypography variant="body2" mt={1}>
              Please connect your wallet to continue
            </SoftTypography>
          )}

          <SoftBox mt={3} mb={4}>
            <ConnectButton />
          </SoftBox>

          <Card sx={{ overflow: "hidden", mb: 4, width: "70%", maxWidth: "100%" }}>
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
                {" "}
                {/* Added left padding to move chart away from sidebar */}
                {isChartLoading ? (
                  <SoftBox
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="250px"
                  >
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
        </SoftBox>
      </Grid>

      {/* Right column with AI assistant */}
      <Grid
        item
        xs={12}
        sm={12}
        md={5}
        lg={5}
        xl={4}
        sx={{ display: "flex", justifyContent: "center" }}
      >
        <SoftBox
          p={3}
          mt={5}
          borderRadius="xl"
          boxShadow="lg"
          backgroundColor="rgba(255,255,255,1)"
          width="100%"
          maxWidth="800px"
          display="flex"
          flexDirection="column"
          sx={{
            height: "calc(100vh - 120px)",
            position: "sticky",
            top: "80px",
            boxShadow: "0 20px 27px 0 rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(226, 232, 240, 0.6)",
          }}
        >
          <SoftTypography variant="h5" mb={2}>
            Loan Assistant
          </SoftTypography>

          {/* Chat messages container with scrolling */}
          <SoftBox
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              mb: 2,
              pr: 1,
            }}
          >
            {aiChat.map((chat, index) => (
              <SoftBox key={index} mb={2}>
                <SoftBadge
                  badgeContent={chat.role === "assistant" ? "AI" : "You"}
                  color={chat.role === "assistant" ? "info" : "primary"}
                  variant="contained"
                />

                {chat.role === "assistant" ? (
                  <SoftBox
                    mt={1}
                    sx={{
                      opacity: chat.isLoading ? 0.7 : 1,
                      fontStyle: chat.isLoading ? "italic" : "normal",
                      "& h1, & h2, & h3, & h4, & h5, & h6": {
                        color: "info.main",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        mt: 1,
                        mb: 0.5,
                      },
                      "& ul, & ol": {
                        pl: 4,
                      },
                      "& p": {
                        mb: 1,
                      },
                      "& code": {
                        backgroundColor: "rgba(0,0,0,0.04)",
                        padding: "0.2em 0.4em",
                        borderRadius: "3px",
                        fontFamily: "monospace",
                      },
                    }}
                  >
                    {chat.isLoading ? (
                      <SoftTypography variant="body2">{chat.content}</SoftTypography>
                    ) : (
                      <ReactMarkdown>{chat.content}</ReactMarkdown>
                    )}
                  </SoftBox>
                ) : (
                  <SoftTypography variant="body2" mt={1}>
                    {chat.content}
                  </SoftTypography>
                )}
              </SoftBox>
            ))}
          </SoftBox>

          {/* Chat input at bottom */}
          <SoftBox component="form" onSubmit={handleAiSubmit}>
            <SoftInput
              placeholder="Ask me anything..."
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              fullWidth
              endAdornment={
                <SoftButton type="submit" color="info" variant="gradient" disabled={aiIsLoading}>
                  {aiIsLoading ? "..." : "Send"}
                </SoftButton>
              }
              icon={<Icon fontSize="small">send</Icon>}
            />
          </SoftBox>
        </SoftBox>
      </Grid>
    </Grid>
  );
}
