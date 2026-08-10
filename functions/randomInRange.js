/**
 * Generates a random number between two values (inclusive). The maximum amount of possible decimal places is determined by the input values.
 * @param {number} min The lowest possible value
 * @param {number} max The highest possible value
 * @returns {number} A random number between min and max
 */
function randomInRange(min, max) {
	const decimalPlaces = (num) => {
		const str = num.toString();
		if (str.includes('e-')) {
			// handle scientific notation like 1e-7
			const [, exp] = str.split('e-');
			return parseInt(exp, 10);
		}
		const dotIndex = str.indexOf('.');
		return dotIndex === -1 ? 0 : str.length - dotIndex - 1;
	};

	const places = Math.max(decimalPlaces(min), decimalPlaces(max));
	const factor = Math.pow(10, places);

	const lo = Math.min(min, max);
	const hi = Math.max(min, max);

	const randomValue = Math.random() * (hi - lo) + lo;

	// round to the correct number of decimal places
	return Math.round(randomValue * factor) / factor;
}

export default randomInRange;