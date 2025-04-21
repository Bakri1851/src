import { useEffect, useRef, useState } from "react"
import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import SoftAlert from "components/SoftAlert"
import SoftInput from "components/SoftInput"
import SoftBadge from "components/SoftBadge"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from '@wagmi/core'
import { rateSwitchingABI } from "constants/RateSwitchingABI"
import ContractConfig from "constants/ContractConfig"
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import Icon from "@mui/material/Icon"
import Chart from "react-apexcharts"
import ButtonGroup from "@mui/material/ButtonGroup" 

export default function Dashboard() {
  const { isConnected } = useAccount()
  const { writeContract } = useWriteContract()

  const [ethPrice, setEthPrice] = useState(null)
  const [priceHistory, setPriceHistory] = useState([])
  const [aiMessage, setAiMessage] = useState("")
  const [aiChat, setAiChat] = useState([
    { role: "assistant", content: "Hello! I'm your loan assistant. How can I help you today?" }
  ])

  const contractConfig = ContractConfig;

  const { data: loanState, refetch: refetchState, isLoading:loadingState,} = useReadContract({
    ...contractConfig,
    functionName: "getLoanState",
  })
  
  const {data : rawLoanAmount} = useReadContract({
    ...contractConfig,
    functionName: "getLoanAmount",
  })
  const {data: rawCollateralAmount} = useReadContract({
    ...contractConfig,
    functionName: "getEthCollateralAmount",
  })

  const {data: repayByTimestamp} = useReadContract({
    ...contractConfig,
    functionName: "getRepayByTimestamp",})

  const loanAmount = rawLoanAmount ? Number(rawLoanAmount) / 1e18 : "Loading..."
  const collateralAmount = rawCollateralAmount ? Number(rawCollateralAmount) / 1e18 : "Loading..."
  const stateLabel = {
    0:"Created",
    1:"Funded",
    2:"Accepted",
    3:"Taken",
    4:"Repaid",
    5:"Liquidated",
  }

  const { data: fixedRate } = useReadContract({
    ...contractConfig,
    functionName: "getFixedRate",
  })

  const { data: floatingRate,
    refetch: refetchFloatingRate,
    isLoading: loadingFloatingRate,
   } = useReadContract({
    ...contractConfig,
    functionName: "getFloatingRate",
  })

  const {
    data: rateType,
    refetch: refetchRateType,
    isLoading: loadingRate,
  } = useReadContract({
    ...contractConfig,
    functionName: "currentRateType",
  })

  const rateTypeLabel = {
    0: "Fixed",
    1: "Floating",
  }

  const handleSwitchRate = async () => {
    try {
      const hash = await writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'switchRateType',
        chainId: contractConfig.chainId,
      });
      console.log("Transaction submitted with hash:", hash.hash);

      await waitForTransactionReceipt({
        hash: hash.hash,
        chainId: contractConfig.chainId 
      });

      await refetchRateType();
    } catch (error) {
      console.error('Switch rate failed:', error);
    }
  }

  const handleRefreshRate = async () => {
    try {
      const hash = await writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: "updateRates",
        chainId: contractConfig.chainId,
      });
      
      console.log("Transaction submitted with hash:", hash);
    } catch (err) {
      console.error("Failed to refresh floating rate:", err);
      alert(`Failed to update rate: ${err.message || "Unknown error"}`);
    } finally {
      await refetchFloatingRate();
    }
  };

  const formatRate = (rate) =>
    rate ? `${(Number(rate) / 100).toFixed(2)}%` : "Loading..."

  const [timeframe, setTimeframe] = useState("7d")
  const [isChartLoading, setIsChartLoading] = useState(false)

  const fetchPriceHistory = async (selectedTimeframe) => {
    setIsChartLoading(true)
    try {
      const days = selectedTimeframe === "1d" ? "1" : 
                   selectedTimeframe === "7d" ? "7" :
                   selectedTimeframe === "30d" ? "30" : "90"
      
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=${days}`)
      const data = await response.json()
      
      let processedPrices = data.prices
      
      if (selectedTimeframe === "30d" || selectedTimeframe === "90d") {
        const nth = selectedTimeframe === "30d" ? 4 : 12
        processedPrices = data.prices.filter((_, index) => index % nth === 0)
      }
      
      const prices = processedPrices.map(price => ({
        x: new Date(price[0]),
        y: price[1]
      }))
      
      setPriceHistory(prices)
    } catch (error) {
      console.error('Error fetching price history:', error)
    } finally {
      setIsChartLoading(false)
    }
  }

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true')
        const data = await response.json()
        setEthPrice(data.ethereum)
      } catch (error) {
        console.error('Error fetching ETH price:', error)
      }
    }
    
    fetchEthPrice()
    fetchPriceHistory(timeframe)
    
    const interval = setInterval(fetchEthPrice, 60000)
    return () => clearInterval(interval)
  }, [timeframe])

  const handleTimeframeChange = (newTimeframe) => {
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe)
    }
  }

  const handleAiSubmit = (e) => {
    e.preventDefault()
    if (!aiMessage.trim()) return
    
    setAiChat(prev => [...prev, { role: "user", content: aiMessage }])
    
    const processQuery = async () => {
      await new Promise(resolve => setTimeout(resolve, 700))
      
      const query = aiMessage.toLowerCase()
      let response = ""
      
      if (query.includes("interest rate") || query.includes("rate")) {
        response = "Interest rates are calculated based on market conditions. Fixed rates provide stability, while floating rates may offer lower costs when markets are favorable."
      } else if (query.includes("collateral")) {
        response = "Collateral is required to secure your loan. The minimum collateral requirement is typically 150% of the loan value to protect against market volatility."
      } else if (query.includes("switch") || query.includes("switching")) {
        response = "You can switch between fixed and floating rates at any time using the 'Switch Rate' button on your active loan. This allows you to optimize your interest payments based on market conditions."
      } else if (query.includes("liquidation") || query.includes("liquidated")) {
        response = "Liquidation occurs if your collateral value falls below the required threshold. To avoid liquidation, you can add more collateral to your position."
      } else if (query.includes("repay") || query.includes("repayment")) {
        response = "You can repay your loan at any time before the due date. Early repayments don't incur any additional fees."
      } else if (query.includes("eth") || query.includes("ethereum") || query.includes("price")) {
        response = ethPrice ? `The current Ethereum price is $${ethPrice.usd.toFixed(2)} with a 24-hour change of ${ethPrice.usd_24h_change.toFixed(2)}%.` : "I'm unable to fetch the Ethereum price at the moment."
      } else {
        response = "I can answer questions about loan rates, collateral requirements, rate switching, liquidations, repayments, and Ethereum prices. How else can I assist you?"
      }
      
      setAiChat(prev => [...prev, { role: "assistant", content: response }])
    }
    
    processQuery()
    setAiMessage("")
  }

  const chartOptions = {
    chart: {
      type: 'area',
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
        }
      },
      zoom: { 
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: ['#17c1e8'],
    dataLabels: { enabled: false },
    stroke: { 
      curve: 'smooth', 
      width: 2,
      lineCap: 'round'
    },
    grid: { 
      show: true,
      borderColor: '#f1f1f1',
      strokeDashArray: 3,
      position: 'back',
      xaxis: {
        lines: {
          show: false,
        }
      },
      yaxis: {
        lines: {
          show: true,
        }
      },
    },
    xaxis: {
      type: 'datetime',
      labels: { 
        show: true,
        format: timeframe === "1d" ? 'HH:mm' : 'dd MMM',
        style: {
          colors: '#777',
          fontSize: '10px',
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { 
      show: true,
      labels: {
        show: true,
        formatter: function(val) {
          return '$' + val.toFixed(0);
        },
        style: {
          colors: '#777',
          fontSize: '10px',
        }
      },
      tickAmount: 5,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      }
    },
    tooltip: { 
      x: { format: timeframe === "1d" ? 'HH:mm' : 'dd MMM yyyy' },
      y: {
        formatter: function(val) {
          return '$' + val.toFixed(2);
        }
      },
      theme: 'light',
      marker: {
        show: true,
      }
    },
    markers: {
      size: 0,
      hover: {
        size: 5,
        sizeOffset: 3
      }
    }
  }
  
  const chartSeries = [{
    name: 'ETH Price',
    data: priceHistory
  }]

  return (
    <Grid container spacing={3} justifyContent="space-between" alignItems="flex-start" minHeight="100vh">
      {/* Left sidebar space compensation */}
      <Grid item xs={0} sm={1} md={1} lg={1} xl={1} sx={{ display: { xs: 'none', sm: 'block' } }}>
      </Grid>
      
      {/* Main content area */}
      <Grid item xs={12} sm={10} md={7} lg={6} xl={7} sx={{ display: 'flex', justifyContent: 'center' }}>
        <SoftBox
          p={3}
          mt={5}
          borderRadius="xl"
          boxShadow="lg"
          backgroundColor="white"
          width="100%"
          maxWidth="900px"
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
        
          <Card sx={{ overflow: 'hidden', mb: 4, width: '70%', maxWidth: '100%' }}>
            <SoftBox p={2}> {/* Reduced padding from p={3} to p={2} */}
              <SoftBox mb={2}>
                <SoftTypography variant="h5" fontWeight="medium" mb={1}>Ethereum Price</SoftTypography>
                {ethPrice ? (
                  <>
                    <SoftTypography variant="h3" fontWeight="bold">${ethPrice.usd.toFixed(2)}</SoftTypography>
                    <SoftTypography variant="body2" color={ethPrice.usd_24h_change >= 0 ? "success" : "error"} fontWeight="medium">
                      {ethPrice.usd_24h_change >= 0 ? "+" : ""}{ethPrice.usd_24h_change.toFixed(2)}% (24h)
                    </SoftTypography>
                  </>
                ) : (
                  <SoftTypography variant="body2">Loading...</SoftTypography>
                )}
              </SoftBox>
              
              <SoftBox width="100%" pl={1}> {/* Added left padding to move chart away from sidebar */}
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
                    color="primary" 
                    size="small"
                    onClick={() => handleTimeframeChange("1d")}
                  >
                    1D
                  </SoftButton>
                  <SoftButton 
                    variant={timeframe === "7d" ? "contained" : "outlined"} 
                    color="primary" 
                    size="small"
                    onClick={() => handleTimeframeChange("7d")}
                  >
                    1W
                  </SoftButton>
                  <SoftButton 
                    variant={timeframe === "30d" ? "contained" : "outlined"} 
                    color="primary" 
                    size="small"
                    onClick={() => handleTimeframeChange("30d")}
                  >
                    1M
                  </SoftButton>
                  <SoftButton 
                    variant={timeframe === "90d" ? "contained" : "outlined"} 
                    color="primary" 
                    size="small"
                    onClick={() => handleTimeframeChange("90d")}
                  >
                    3M
                  </SoftButton>
                </ButtonGroup>
              </SoftBox>
            </SoftBox>
          </Card>

          {/* Add other dashboard components here */}
        </SoftBox>
      </Grid>

      {/* Right column with AI assistant */}
      <Grid item xs={12} sm={12} md={5} lg={5} xl={4} sx={{ display: 'flex', justifyContent: 'center' }}>
        <SoftBox
          p={3}
          mt={5}
          borderRadius="xl"
          boxShadow="lg"
          backgroundColor="white"
          width="100%"
          maxWidth="400px"
          display="flex"
          flexDirection="column"
          sx={{ 
            height: 'calc(100vh - 120px)',
            position: 'sticky',
            top: '80px'
          }}
        >
          <SoftTypography variant="h5" mb={2}>Loan Assistant</SoftTypography>
          
          {/* Chat messages container with scrolling */}
          <SoftBox 
            sx={{ 
              flexGrow: 1, 
              overflowY: 'auto',
              mb: 2,
              pr: 1
            }}
          >
            {aiChat.map((chat, index) => (
              <SoftBox key={index} mb={2}>
                <SoftBadge
                  badgeContent={chat.role === "assistant" ? "AI" : "You"}
                  color={chat.role === "assistant" ? "info" : "primary"}
                  variant="contained"
                />
                <SoftTypography variant="body2" mt={1}>
                  {chat.content}
                </SoftTypography>
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
                <SoftButton type="submit" color="primary" variant="contained">
                  Send
                </SoftButton>
              }
              icon={<Icon fontSize="small">send</Icon>}
            />
          </SoftBox>
        </SoftBox>
      </Grid>
    </Grid>
  )
}
