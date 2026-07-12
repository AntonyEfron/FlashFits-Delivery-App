import axiosInstance from "../../config/axiosConfig";

/**
 * GET /api/rider/earnings/current-week
 * Returns current week's payout + daily breakdown.
 */
export const getCurrentWeekEarnings = async () => {
  try {
    const response = await axiosInstance.get("/deliveryRider/earnings/current-week");
    return response.data;
  } catch (error) {
    console.error("❌ getCurrentWeekEarnings:", error.response?.data || error.message);
    throw error;
  }
};

export const getTodayEarnings = async () => {
  try {
    const response = await axiosInstance.get("/deliveryRider/earnings/today");
    return response.data;
  } catch (error) {
    console.error("❌ getTodayEarnings:", error.response?.data || error.message);
    throw error;
  }
};

export const getYesterdayEarnings = async () => {
  try {
    const response = await axiosInstance.get("/deliveryRider/earnings/yesterday");
    return response.data;
  } catch (error) {
    console.error("❌ getYesterdayEarnings:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * GET /api/rider/earnings/history
 * Returns past weekly payouts (paginated).
 */
export const getEarningsHistory = async (page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(`/deliveryRider/earnings/history?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("❌ getEarningsHistory:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * GET /api/rider/incentives
 * Returns active incentive programs + rider's progress toward each.
 */
export const getRiderIncentives = async () => {
  try {
    const response = await axiosInstance.get("/deliveryRider/incentives");
    return response.data;
  } catch (error) {
    console.error("❌ getRiderIncentives:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * GET /api/rider/wallet
 * Returns wallet balance and recent transactions.
 */
export const getRiderWallet = async () => {
  try {
    const response = await axiosInstance.get("/deliveryRider/wallet");
    return response.data;
  } catch (error) {
    console.error("❌ getRiderWallet:", error.response?.data || error.message);
    throw error;
  }
};
