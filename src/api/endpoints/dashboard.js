import client from "../client.js";

export const dashboardEndpoints = {
    getSummary: () => client.get("/inverter/dashboard2"),
};
