export const toNumber = (value, fallback = 0) => {
	const parsed = typeof value === "number" ? value : Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatPrice = (value, decimals = 2) => toNumber(value).toFixed(decimals);
