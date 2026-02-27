import { BarChart, PlusCircle, ShieldCheck, ShoppingBasket } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import VerificationsTab from "../components/VerificationsTab";
import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";

const AdminPage = () => {
	const [activeTab, setActiveTab] = useState("create");
	const { fetchAllProducts, fetchMyProducts } = useProductStore();
	const { user } = useUserStore();
	const isAdmin = user?.role === "admin";

	const tabs = [
		{ id: "create", label: "Create Product", icon: PlusCircle },
		{ id: "products", label: "Products", icon: ShoppingBasket },
		...(isAdmin
			? [
					{ id: "verifications", label: "Verifications", icon: ShieldCheck },
					{ id: "analytics", label: "Analytics", icon: BarChart },
			  ]
			: []),
	];
	const [seeding, setSeeding] = useState(false);
	const [seedResult, setSeedResult] = useState(null);

	useEffect(() => {
		if (isAdmin) {
			fetchAllProducts();
			return;
		}

		fetchMyProducts();
	}, [fetchAllProducts, fetchMyProducts, isAdmin]);

	return (
		<div className='min-h-screen relative overflow-hidden'>
			<div className='relative z-10 container mx-auto px-4 py-16'>
				{process.env.NODE_ENV === "development" && isAdmin && (
					<div className='flex justify-center items-center mb-6 space-x-3'>
						<button
							className='bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md'
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
							className='bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md'
							onClick={async () => {
								if (!confirm('Delete ALL products? This cannot be undone.')) return;
								setSeedResult(null);
								try {
									const res = await fetch('/api/dev/clear-products', { method: 'POST' });
									const json = await res.json();
									setSeedResult(json);
								} catch (err) {
									setSeedResult({ success: false, message: err.message });
								}
							}}
						>
							Delete All Products (dev)
						</button>

						{seedResult && (
							<div className='ml-4 text-sm'>
								{seedResult.success ? (seedResult.createdCount ? `${seedResult.createdCount} products created` : `${seedResult.deletedCount ?? 0} products deleted`) : `Error: ${seedResult.message}`}
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
					{isAdmin ? "Admin Dashboard" : "Seller Dashboard"}
				</motion.h1>

				<div className='flex justify-center mb-8'>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center px-4 py-2 mx-2 rounded-md transition-colors duration-200 ${
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
				{activeTab === "create" && <CreateProductForm />}
				{activeTab === "products" && <ProductsList canToggleFeatured={isAdmin} />}
				{activeTab === "verifications" && <VerificationsTab />}
				{activeTab === "analytics" && <AnalyticsTab />}
			</div>
		</div>
	);
};
export default AdminPage;
