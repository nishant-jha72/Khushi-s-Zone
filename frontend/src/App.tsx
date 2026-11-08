import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import ScrollToTop from "./components/layout/ScrollToTop";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import ContactPage from "./pages/ContactPage";
import MyAccountPage from "./pages/MyAccountPage";
import { AdminPage } from "./pages/admin/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";
import CheckoutPage from "./components/checkout/CheckoutPage";
import OrdersPage from "./order/orders";
import SearchResultPage from "./components/products/SearchResultPage";

function AppContent() {
  const navigate = useNavigate();

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Main Customer Layout with persistent Header, Footer, and Drawers */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route
            path="/category"
            element={<Navigate to="/category/dresses" replace />}
          />
          <Route
            path="/shop"
            element={<Navigate to="/category/dresses" replace />}
          />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/account" element={<MyAccountPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route
            path="/search"
            element={
              <SearchResultPage
                onSelectProduct={(productId) =>
                  navigate(`/product/${productId}`)
                }
              />
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Dedicated Admin Portal Route */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
