import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight, Loader } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [mfaCode, setMfaCode] = useState("");

	const { login, verifyMfaLogin, cancelMfaChallenge, loading, mfaRequired } = useUserStore();

	const handleSubmit = async (e) => {
		e.preventDefault();
		await login(email, password);
	};

	const handleMfaSubmit = async (e) => {
		e.preventDefault();
		await verifyMfaLogin(mfaCode);
	};

	return (
		<div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<motion.div
				className='sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<h2 className='mt-6 text-center text-3xl font-extrabold text-accent-400'>Welcome back</h2>
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<div className='bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10'>
					{!mfaRequired ? (
						<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<label htmlFor='email' className='block text-sm font-medium text-gray-300'>
								Email address
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Mail className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='email'
									type='email'
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className=' block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 
									rounded-md shadow-sm
							 placeholder-gray-400 focus:outline-none focus:ring-accent-500 
							 focus:border-accent-500 sm:text-sm'
									placeholder='you@example.com'
								/>
							</div>
						</div>

						<div>
							<label htmlFor='password' className='block text-sm font-medium text-gray-300'>
								Password
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='password'
									type='password'
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className=' block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 
							rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent-500 focus:border-accent-500 sm:text-sm'
									placeholder='••••••••'
								/>
							</div>
						</div>

							<button
								type='submit'
								className='w-full flex justify-center py-2 px-4 border border-transparent 
						rounded-md shadow-sm text-sm font-medium text-white bg-accent-600
						 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2
						  focus:ring-accent-500 transition duration-150 ease-in-out disabled:opacity-50'
								disabled={loading}
							>
							{loading ? (
								<>
									<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
									Loading...
								</>
							) : (
								<>
									<LogIn className='mr-2 h-5 w-5' aria-hidden='true' />
									Login
								</>
							)}
							</button>
						</form>
					) : (
						<form onSubmit={handleMfaSubmit} className='space-y-6'>
							<div className='rounded-md border border-accent-500/40 bg-accent-500/10 p-3 text-sm text-gray-200'>
								Enter the 6-digit code from your authenticator app to finish signing in.
							</div>
							<div>
								<label htmlFor='mfaCode' className='block text-sm font-medium text-gray-300'>
									Authenticator Code
								</label>
								<input
									id='mfaCode'
									type='text'
									required
									value={mfaCode}
									onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
									className='mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent-500 focus:border-accent-500 sm:text-sm'
									placeholder='123456'
									inputMode='numeric'
									autoComplete='one-time-code'
								/>
							</div>
							<div className='flex gap-2'>
								<button
									type='button'
									onClick={cancelMfaChallenge}
									className='w-1/3 py-2 px-4 rounded-md text-sm font-medium text-gray-200 bg-gray-700 hover:bg-gray-600'
								>
									Back
								</button>
								<button
									type='submit'
									className='w-2/3 flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 disabled:opacity-50'
									disabled={loading || mfaCode.length < 6}
								>
									{loading ? (
										<>
											<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
											Verifying...
										</>
									) : (
										"Verify and Login"
									)}
								</button>
							</div>
						</form>
					)}

					<p className='mt-8 text-center text-sm text-gray-400'>
						Not a member?{" "}
						<Link to='/signup' className='font-medium text-accent-400 hover:text-accent-300'>
							Sign up now <ArrowRight className='inline h-4 w-4' />
						</Link>
					</p>
				</div>
			</motion.div>
		</div>
	);
};
export default LoginPage;
