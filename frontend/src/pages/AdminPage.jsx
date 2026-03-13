import { BarChart, ExternalLink, Flag, PlusCircle, ShieldCheck, ShoppingBasket, Store, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import FulfillmentTab from "../components/FulfillmentTab";
import ProductsList from "../components/ProductsList";
import ReportsTab from "../components/ReportsTab";
import StorefrontSettingsTab from "../components/StorefrontSettingsTab";
import VerificationsTab from "../components/VerificationsTab";
import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";

const AdminPage = () => {
	const { fetchAllProducts, fetchMyProducts } = useProductStore();
	const { user } = useUserStore();
	const isAdmin = user?.role === "admin";
	const normalizedKycStatus = String(user?.kycStatus || "").trim().toLowerCase();
	const hasApprovedKyc = normalizedKycStatus === "verified" || normalizedKycStatus === "approved";
	const canManageInventory = isAdmin || hasApprovedKyc;
	const [activeTab, setActiveTab] = useState(() => (canManageInventory ? "create" : "storefront"));

	const tabs = [
		...(canManageInventory
			? [
					{ id: "create", label: "Create Product", icon: PlusCircle },
					{ id: "products", label: "Products", icon: ShoppingBasket },
					{ id: "fulfillment", label: "Fulfillment", icon: Truck },
			  ]
			: []),
		{ id: "storefront", label: "Storefront", icon: Store },
		...(isAdmin
			? [
					{ id: "verifications", label: "Verifications", icon: ShieldCheck },
					{ id: "reports", label: "Reports", icon: Flag },
					{ id: "analytics", label: "Analytics", icon: BarChart },
			  ]
			: []),
	];
	const [seeding, setSeeding] = useState(false);
	const [seedResult, setSeedResult] = useState(null);

	useEffect(() => {
		if (!canManageInventory && ["create", "products", "fulfillment"].includes(activeTab)) {
			setActiveTab("storefront");
		}
	}, [canManageInventory, activeTab]);

	useEffect(() => {
		if (canManageInventory) {
			if (isAdmin) {
				fetchAllProducts();
			} else {
				fetchMyProducts();
			}
		}
	}, [fetchAllProducts, fetchMyProducts, canManageInventory, isAdmin]);

	return (
		<div className='min-h-screen relative overflow-hidden'>
			<div className='relative z-10 container mx-auto px-4 py-16'>
				{import.meta.env.DEV && isAdmin && (
					<div className='mb-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center'>
						<button
							className='w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 sm:w-auto'
							onClick={async () => {
								setSeeding(true);
								setSeedResult(null);
								try {
									const res = await fetch('/api/dev/seed', { method: 'POST' });
									const json = await res.json();
									setSeedResult(json);
								} catch (err) {
									setSeedResult({ success: false, message: err.message });
								} finally {
									setSeeding(false);
								}
							}}
						>
							{seeding ? 'Seeding...' : 'Seed Fake Products (dev)'}
						</button>

						<button
							className='w-full rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 sm:w-auto'
							onClick={async () => {
								if (!confirm('Delete fake seeded products only? This cannot be undone.')) return;
								setSeedResult(null);
								try {
									const res = await fetch('/api/dev/clear-fake-products', { method: 'POST' });
									const json = await res.json();
									setSeedResult(json);
								} catch (err) {
									setSeedResult({ success: false, message: err.message });
								}
							}}
						>
							Delete Fake Products (dev)
						</button>

						{seedResult && (
							<div className='w-full text-center text-sm sm:w-auto sm:text-left'>
								{seedResult.success
									? (seedResult.createdCount
										? `${seedResult.createdCount} products created`
										: `${seedResult.deletedCount ?? 0} fake products deleted`)
									: `Error: ${seedResult.message}`}
							</div>
						)}
					</div>
				)}
				<motion.h1
					className='text-4xl font-bold mb-8 text-accent-400 text-center'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					{isAdmin ? "Admin Dashboard" : canManageInventory ? "Seller Dashboard" : "Storefront Setup"}
				</motion.h1>

				{!canManageInventory && (
					<div className='mx-auto mb-6 max-w-3xl rounded-lg border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-gray-200'>
						Inventory management unlocks after KYC approval. You can still customize your storefront while your verification is pending.
					</div>
				)}

				<div className='flex justify-center mb-6'>
					<Link
						to={`/shop/${user?._id}`}
						className='inline-flex items-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500'
					>
						<ExternalLink className='h-4 w-4' />
						View My Storefront
					</Link>
				</div>

				<div className='mb-8 flex flex-wrap justify-center gap-2'>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex min-w-[140px] items-center justify-center rounded-md px-3 py-2 text-sm transition-colors duration-200 sm:min-w-0 sm:px-4 ${
								activeTab === tab.id
									? "bg-accent-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							}`}
						>
							<tab.icon className='mr-2 h-5 w-5' />
							{tab.label}
						</button>
					))}
				</div>
				{canManageInventory && activeTab === "create" && <CreateProductForm />}
				{canManageInventory && activeTab === "products" && <ProductsList canToggleFeatured={isAdmin} />}
				{canManageInventory && activeTab === "fulfillment" && <FulfillmentTab />}
				{activeTab === "storefront" && <StorefrontSettingsTab />}
				{activeTab === "verifications" && <VerificationsTab />}
				{activeTab === "reports" && <ReportsTab />}
				{activeTab === "analytics" && <AnalyticsTab />}
			</div>
		</div>
	);
};
export default AdminPage;
