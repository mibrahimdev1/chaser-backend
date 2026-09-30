const rearrangePrices = (products) => {
    return products.map((product) => {
        // Sort prices based on the interval and interval_count in descending order
        const sortedPrices = product.prices.sort((a, b) => {
            // Compare based on interval and interval_count
            const intervalOrder = {
                month: 1,
                year: 2,
            };

            const aOrder = intervalOrder[a.recurring.interval] * 100 + a.recurring.interval_count;
            const bOrder = intervalOrder[b.recurring.interval] * 100 + b.recurring.interval_count;

            // Reverse the subtraction for descending order
            return bOrder - aOrder;
        });

        // Return product with sorted prices
        return {
            ...product,
            prices: sortedPrices,
        };
    });
};

module.exports = {
    rearrangePrices,
};
