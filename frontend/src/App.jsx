import { Link, Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import VerifiedSellerPage from "./pages/VerifiedSellerPage";
import LearnWhatWeCollectPage from "./pages/LearnWhatWeCollectPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import SettingsPage from "./pages/SettingsPage";
import ShopPage from "./pages/ShopPage";
import MessagesPage from "./pages/MessagesPage";

import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import { useUserStore } from "./stores/useUserStore";
import { useEffect, useState } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import CartPage from "./pages/CartPage";
import { useCartStore } from "./stores/useCartStore";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";
import OrdersPage from "./pages/OrdersPage";
import ChatbotWidget from "./components/ChatbotWidget";

function App() {
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { getCartItems } = useCartStore();
	const normalizedKycStatus = String(user?.kycStatus || "").trim().toLowerCase();
	const hasSubmittedVerification = Boolean(user?.hasSubmittedVerification);
	const hasPendingOrHigherKyc =
		normalizedKycStatus === "pending" || normalizedKycStatus === "verified" || normalizedKycStatus === "approved";
	const isPrivilegedUser = user?.role === "admin" || user?.role === "seller";
	const mustEnableMfaForPrivileged = user?.role === "seller" && !user?.mfaEnabled;
	const canAccessSellerHub =
		(user?.role === "admin" || (hasSubmittedVerification && hasPendingOrHigherKyc)) && !mustEnableMfaForPrivileged;
	const isBuyer = Boolean(user && !isPrivilegedUser);
	const shouldNudgeBuyerMfa = isBuyer && !user?.mfaEnabled;
	const [dismissedMfaNudge, setDismissedMfaNudge] = useState(false);

	useEffect(() => {
		if (!user?._id) {
			setDismissedMfaNudge(false);
			return;
		}

		const storageKey = `mfa_nudge_dismissed:${user._id}`;
		setDismissedMfaNudge(localStorage.getItem(storageKey) === "1");
	}, [user?._id]);

	const dismissMfaNudge = () => {
		if (!user?._id) {
			setDismissedMfaNudge(true);
			return;
		}

		localStorage.setItem(`mfa_nudge_dismissed:${user._id}`, "1");
		setDismissedMfaNudge(true);
	};
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (!user) return;

		getCartItems();
	}, [getCartItems, user]);

	if (checkingAuth) return <LoadingSpinner />;

	return (
		<div className='min-h-screen bg-gray-900 text-white relative overflow-hidden'>
			{/* Background gradient */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute inset-0'>
					<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1)_0%,rgba(143,91,255,0.2)_45%,rgba(195,198,255,0.3)_100%)]' />
				</div>
			</div>

			<div className='relative z-50 pt-20'>
				<Navbar />
				{shouldNudgeBuyerMfa && !dismissedMfaNudge && (
					<div className='mx-4 md:mx-8 mt-2 mb-4 rounded-lg border border-accent-500/40 bg-accent-500/15 px-4 py-3'>
						<div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
							<p className='text-sm text-gray-100'>
								Secure your buyer account with MFA. It only takes a minute in Settings.
							</p>
							<div className='flex items-center gap-2'>
								<Link
									to='/settings'
									className='rounded-md bg-accent-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-500'
								>
									Set Up MFA
								</Link>
								<button
									type='button'
									onClick={dismissMfaNudge}
									className='rounded-md bg-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-200 hover:bg-gray-600'
								>
									Later
								</button>
							</div>
						</div>
					</div>
				)}
				<Routes>
					<Route path='/' element={<HomePage />} />
					<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
					<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
					<Route
						path='/secret-dashboard'
						element={canAccessSellerHub ? <AdminPage /> : <Navigate to={user ? '/settings' : '/login'} />}
					/>
					<Route path='/category/:category' element={<CategoryPage />} />
					<Route path='/product/:id' element={<ProductPage />} />
					<Route path='/cart' element={user ? <CartPage /> : <Navigate to='/login' />} />
					<Route path='/orders' element={user ? <OrdersPage /> : <Navigate to='/login' />} />
					<Route path='/verified-seller' element={<VerifiedSellerPage />} />
					<Route path='/learn-what-we-collect' element={<LearnWhatWeCollectPage />} />
					<Route path='/how-it-works' element={<HowItWorksPage />} />
					<Route path='/settings' element={<SettingsPage />} />
					<Route path='/shop/:shopId' element={<ShopPage />} />
					<Route path='/messages' element={user ? <MessagesPage /> : <Navigate to='/login' />} />
					<Route
						path='/purchase-success'
						element={user ? <PurchaseSuccessPage /> : <Navigate to='/login' />}
					/>
					<Route path='/purchase-cancel' element={user ? <PurchaseCancelPage /> : <Navigate to='/login' />} />
				</Routes>
			</div>
			<ChatbotWidget />
			<Toaster />
		</div>
	);
}

export default App;
