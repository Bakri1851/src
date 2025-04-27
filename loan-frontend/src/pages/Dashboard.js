import { useState } from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftBadge from "components/SoftBadge";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import useOpenAI from "hooks/useOpenAI";
import ReactMarkdown from "react-markdown";
import UtilizationDisplay from "components/UtilizationDisplay";
import EthereumPriceChart from "components/EthereumPriceChart";

export default function Dashboard() {
  const { isConnected } = useAccount();

  const [aiChat, setAiChat] = useState([]);
  const [aiMessage, setAiMessage] = useState("");

  const { askLoanQuestion, isLoading: aiIsLoading } = useOpenAI();

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
          mt={1}
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

          <SoftBox mt={3} mb={1}>
            <ConnectButton />
          </SoftBox>
          <SoftBox width="100%" display="flex" flexDirection="column" alignItems="center">
            {/* UtilizationDisplay with controlled width */}
            <SoftBox width="100%" maxWidth="700px" mt={4} mb={2}>
              <UtilizationDisplay />
            </SoftBox>

            {/* Ethereum Price Chart with adjusted width */}
            <SoftBox width="100%" maxWidth="700px" mb={4}>
              <EthereumPriceChart />
            </SoftBox>
          </SoftBox>
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
          {/* Rest of the AI assistant code remains unchanged */}
          <SoftTypography variant="h5" mb={2}>
            Loan Assistant
          </SoftTypography>

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
