import { CheckCircle, MessageCircle, ShoppingCart, LogIn, LogOut, Lock, Menu, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";

const Navbar = () => {
	const [isBurgerOpen, setIsBurgerOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);
	const { user, logout } = useUserStore();
	const isAdmin = user?.role === "admin";
	const isSeller = user?.role === "seller";
	const mustEnableMfaForPrivileged = isSeller && !user?.mfaEnabled;
	const normalizedKycStatus = String(user?.kycStatus || "").trim().toLowerCase();
	const hasSubmittedVerification = Boolean(user?.hasSubmittedVerification);
	const hasPendingOrHigherKyc =
		normalizedKycStatus === "pending" || normalizedKycStatus === "verified" || normalizedKycStatus === "approved";
	const hasVerifiedBadge = isSeller && isVerifiedSeller;
	const canOpenDashboard = (isAdmin || (hasSubmittedVerification && hasPendingOrHigherKyc)) && !mustEnableMfaForPrivileged;
	const { cart } = useCartStore();
	const linkClassName = "text-gray-300 transition duration-300 ease-in-out";
	const accountDisplayName = user?.name || user?.email || "Account";
	const accountEmail = user?.email || "Not signed in";

	const closeMenu = () => {
		setIsBurgerOpen(false);
		setIsProfileOpen(false);
	};
	const handleLogout = () => {
		logout();
		closeMenu();
	};

	useEffect(() => {
		let ignore = false;

		const loadVerificationStatus = async () => {
			if (!user || user.role === "admin") {
				if (!ignore) {
					setIsVerifiedSeller(false);
				}
				return;
			}

			try {
				const response = await axios.get("/verifications/me");
				if (!ignore) {
					setIsVerifiedSeller(String(response.data?.status || "").trim().toLowerCase() === "approved");
				}
			} catch {
				if (!ignore) {
					setIsVerifiedSeller(false);
				}
			}
		};

		loadVerificationStatus();

		return () => {
			ignore = true;
		};
	}, [user?._id, user?.role]);

	return (
		<header
			className='fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b'
			style={{ borderBottomColor: "#8F5BFF" }}
		>
			<div className='container mx-auto px-4 py-3 relative'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<Link
							to='/'
							onClick={closeMenu}
							className='text-2xl font-bold items-center space-x-2 flex'
							style={{ color: "#8F5BFF" }}
						>
							<img
								src='/graphtrust-logo.png'
								alt='GraphTrust logo'
								className='h-6 w-6 rounded object-contain'
							/>
							GraphTrust
						</Link>
					</div>

					<div className='flex items-center gap-3'>
						<nav className='hidden md:flex items-center gap-4 ml-auto'>
						{user && (
							<Link
								to='/messages'
								className={`${linkClassName} inline-flex items-center gap-1`}
								onMouseEnter={(event) => (event.currentTarget.style.color = "#8F5BFF")}
								onMouseLeave={(event) => (event.currentTarget.style.color = "rgb(209, 213, 219)")}
							>
								<MessageCircle size={16} />
								Chats
							</Link>
						)}
						{user && (
							<Link
								to='/cart'
								className='relative group text-gray-300 transition duration-300 ease-in-out'
								onMouseEnter={(event) => (event.currentTarget.style.color = "#8F5BFF")}
								onMouseLeave={(event) => (event.currentTarget.style.color = "rgb(209, 213, 219)")}
							>
								<ShoppingCart className='inline-block mr-1' size={20} style={{ color: "inherit" }} />
								<span className='hidden sm:inline'>Cart</span>
								{cart.length > 0 && (
									<span
										className='absolute -top-2 -left-2 text-white rounded-full px-2 py-0.5 text-xs transition duration-300 ease-in-out'
										style={{ backgroundColor: "#8F5BFF" }}
									>
										{cart.length}
									</span>
								)}
							</Link>
						)}
						{canOpenDashboard && (
							<Link
								className='text-white px-3 py-1 rounded-md font-medium transition duration-300 ease-in-out flex items-center'
								style={{ backgroundColor: "#8F5BFF" }}
								onMouseEnter={(event) => (event.currentTarget.style.opacity = "0.8")}
								onMouseLeave={(event) => (event.currentTarget.style.opacity = "1")}
								to='/secret-dashboard'
							>
								<Lock className='inline-block mr-1' size={18} />
								<span className='hidden sm:inline'>{isAdmin ? "Admin" : "Seller"} Hub</span>
							</Link>
						)}
						</nav>

						<button
							type='button'
							className='text-gray-200 hover:text-white'
							onClick={() => {
								setIsProfileOpen(false);
								setIsBurgerOpen((prev) => !prev);
							}}
							aria-label='Toggle menu'
						>
							{isBurgerOpen ? <X size={24} /> : <Menu size={24} />}
						</button>

						<button
							type='button'
							onClick={() => {
								setIsBurgerOpen(false);
								setIsProfileOpen((prev) => !prev);
							}}
							className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 bg-gray-800/80 text-gray-100 hover:border-accent-500/60 hover:bg-gray-800'
							aria-label='Open profile menu'
						>
							<User size={16} />
						</button>
					</div>
				</div>

				{isBurgerOpen && (
					<div className='absolute right-4 top-16 w-56 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl z-50 overflow-hidden'>
						<Link to='/' onClick={closeMenu} className='block px-4 py-3 text-gray-200 hover:bg-gray-800'>
							Marketplace
						</Link>
						{user && (
							<Link
								to='/verified-seller'
								onClick={closeMenu}
								className='block px-4 py-3 text-gray-200 hover:bg-gray-800'
							>
								Be a Seller
							</Link>
						)}
						<Link
							to='/how-it-works'
							onClick={closeMenu}
							className='block px-4 py-3 text-gray-200 hover:bg-gray-800'
						>
							How It Works
						</Link>
						{user && (
							<Link
								to='/orders'
								onClick={closeMenu}
								className='block px-4 py-3 text-gray-200 hover:bg-gray-800'
							>
								Orders
							</Link>
						)}
						{!user && (
							<Link
								to='/login'
								onClick={closeMenu}
								className='block px-4 py-3 text-gray-200 hover:bg-gray-800'
							>
								<span className='inline-flex items-center gap-2'>
									<LogIn size={16} />
									Sign In
								</span>
							</Link>
						)}
					</div>
				)}

				{isProfileOpen && (
					<div className='absolute right-4 top-16 w-64 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl z-50 overflow-hidden'>
						<div className='px-4 py-3 border-b border-gray-700'>
							<div className='flex items-center gap-2'>
								<p className='truncate text-sm font-semibold text-gray-100'>{accountDisplayName}</p>
								{hasVerifiedBadge && (
									<span className='inline-flex items-center gap-1 rounded-md border border-green-500/50 bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-green-300'>
										<CheckCircle size={12} /> Verified Seller
									</span>
								)}
							</div>
							<p className='truncate text-xs text-gray-400'>{accountEmail}</p>
						</div>
						{user ? (
							<>
								<Link
									to='/settings'
									onClick={closeMenu}
									className='block px-4 py-3 text-gray-200 hover:bg-gray-800'
								>
									Settings
								</Link>
								<button
									type='button'
									onClick={handleLogout}
									className='w-full text-left px-4 py-3 text-red-300 hover:bg-gray-800 flex items-center gap-2'
								>
									<LogOut size={16} />
									Sign Out
								</button>
							</>
						) : (
							<Link
								to='/login'
								onClick={closeMenu}
								className='block px-4 py-3 text-gray-200 hover:bg-gray-800'
							>
								<span className='inline-flex items-center gap-2'>
									<LogIn size={16} />
									Sign In
								</span>
							</Link>
						)}
					</div>
				)}
			</div>
		</header>
	);
};
export default Navbar;
