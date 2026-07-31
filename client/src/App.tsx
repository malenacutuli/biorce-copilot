import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import KnowledgeBase from "./pages/KnowledgeBase";
import Regulatory from "./pages/Regulatory";
import Competitive from "./pages/Competitive";
import Partnerships from "./pages/Partnerships";
import Discrepancies from "./pages/Discrepancies";
import Alerts from "./pages/Alerts";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import Copilot from "./pages/Copilot";
import Login from "./pages/Login";
import BoardMemo from "./pages/BoardMemo";
import Admin from "./pages/Admin";
import PharmaSignal from "./pages/PharmaSignal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/knowledge" component={KnowledgeBase} />
      <Route path="/regulatory" component={Regulatory} />
      <Route path="/competitive" component={Competitive} />
      <Route path="/partnerships" component={Partnerships} />
      <Route path="/discrepancies" component={Discrepancies} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/graph" component={KnowledgeGraph} />
      <Route path="/copilot" component={Copilot} />
      <Route path="/login" component={Login} />
      <Route path="/board-memo" component={BoardMemo} />
      <Route path="/admin" component={Admin} />
      <Route path="/pharma-signal" component={PharmaSignal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
