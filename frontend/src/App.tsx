import { useState } from "react";
import HomePage from "./pages/HomePage";
import MyAccountPage from "./pages/MyAccountPage";
import { AdminPage } from "./pages/admin/AdminPage";
import CategoryProductsPage from "./pages/CategoryProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";

function App() {
  const [view, setView] = useState<"home" | "category" | "product" | "account" | "admin">("home");
  const [selectedCategory, setSelectedCategory] = useState<string>("dresses");
  const [selectedProductId, setSelectedProductId] = useState<string | number>("");
  const [accountTab, setAccountTab] = useState<string>("profile");

  const openAccount = (tab: string = "profile") => {
    setAccountTab(tab);
    setView("account");
  };

  const openAdmin = () => {
    setView("admin");
  };

  const openCategory = (slug: string) => {
    setSelectedCategory(slug);
    setView("category");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (productId: string | number) => {
    setSelectedProductId(productId);
    setView("product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (view === "account") {
    return (
      <MyAccountPage
        defaultTab={accountTab}
        onBackToHome={() => setView("home")}
      />
    );
  }

  if (view === "admin") {
    return <AdminPage onBackToHome={() => setView("home")} />;
  }

  if (view === "category") {
    return (
      <CategoryProductsPage
        categorySlug={selectedCategory}
        onBackToHome={() => setView("home")}
        onSelectProduct={openProduct}
        onOpenAccount={openAccount}
        onOpenAdmin={openAdmin}
      />
    );
  }

  if (view === "product") {
    return (
      <ProductDetailsPage
        productId={selectedProductId}
        onBack={() => setView("category")}
        onOpenAccount={openAccount}
        onOpenAdmin={openAdmin}
      />
    );
  }

  return (
    <HomePage
      onOpenAccount={openAccount}
      onOpenAdmin={openAdmin}
      onSelectCategory={openCategory}
      onSelectProduct={openProduct}
    />
  );
}

export default App;
