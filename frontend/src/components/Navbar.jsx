import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const Navbar = () => {
	const [isBurgerOpen, setIsBurgerOpen] = useState(false);
	const { user, logout } = useUserStore();
	const isAdmin = user?.role === "admin";
	const isSeller = user?.role === "seller";
	const canOpenDashboard = isAdmin || isSeller;
	const { cart } = useCartStore();
	const linkClassName = "text-gray-300 transition duration-300 ease-in-out";

	const closeMenu = () => setIsBurgerOpen(false);
	const handleLogout = () => {
		logout();
		closeMenu();
	};

	return (
		<header
			className='fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b'
			style={{ borderBottomColor: "#8F5BFF" }}
		>
			<div className='container mx-auto px-4 py-3 relative'>
				<div className='flex items-center justify-between'>
					<Link
						to='/'
						onClick={closeMenu}
						className='text-2xl font-bold items-center space-x-2 flex'
						style={{ color: "#8F5BFF" }}
					>
						E-Commerce
					</Link>

					<nav className='hidden md:flex items-center gap-4'>
						<Link
							to='/'
							className={linkClassName}
							onMouseEnter={(event) => (event.currentTarget.style.color = "#8F5BFF")}
							onMouseLeave={(event) => (event.currentTarget.style.color = "rgb(209, 213, 219)")}
						>
							Home
						</Link>
						{user && (
							<Link
								to='/verified-seller'
								className={linkClassName}
								onMouseEnter={(event) => (event.currentTarget.style.color = "#8F5BFF")}
								onMouseLeave={(event) => (event.currentTarget.style.color = "rgb(209, 213, 219)")}
							>
								Be a Seller
							</Link>
						)}
						{user && (
							<Link
								to='/messages'
								className={linkClassName}
								onMouseEnter={(event) => (event.currentTarget.style.color = "#8F5BFF")}
								onMouseLeave={(event) => (event.currentTarget.style.color = "rgb(209, 213, 219)")}
							>
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
						onClick={() => setIsBurgerOpen((prev) => !prev)}
						aria-label='Toggle menu'
					>
						{isBurgerOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>

				{isBurgerOpen && (
					<div className='absolute right-4 top-16 w-56 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl z-50 overflow-hidden'>
						<Link to='/' onClick={closeMenu} className='block px-4 py-3 text-gray-200 hover:bg-gray-800'>
							Home
						</Link>
						<Link to='/' onClick={closeMenu} className='block px-4 py-3 text-gray-200 hover:bg-gray-800'>
							Marketplace
						</Link>
						<Link
							to='/how-it-works'
							onClick={closeMenu}
							className='block px-4 py-3 text-gray-200 hover:bg-gray-800'
						>
							How It Works
						</Link>
						<Link
							to='/settings'
							onClick={closeMenu}
							className='block px-4 py-3 text-gray-200 hover:bg-gray-800'
						>
							Settings
						</Link>
						<div className='border-t border-gray-700' />
						{user ? (
							<button
								type='button'
								onClick={handleLogout}
								className='w-full text-left px-4 py-3 text-red-300 hover:bg-gray-800 flex items-center gap-2'
							>
								<LogOut size={16} />
								Sign Out
							</button>
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
