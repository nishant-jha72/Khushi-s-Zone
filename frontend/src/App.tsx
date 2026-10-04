import { useState } from "react";
import HomePage from "./pages/HomePage";
import MyAccountPage from "./pages/MyAccountPage";

function App() {
  const [view, setView] = useState<"home" | "account">("home");
  const [accountTab, setAccountTab] = useState<string>("profile");

  const openAccount = (tab: string = "profile") => {
    setAccountTab(tab);
    setView("account");
  };

  if (view === "account") {
    return (
      <MyAccountPage
        defaultTab={accountTab}
        onBackToHome={() => setView("home")}
      />
    );
  }

  return <HomePage onOpenAccount={openAccount} />;
}

export default App;
