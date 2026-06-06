export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REQUEST_OTP: "/auth/manager/request-otp",
    VERIFY_OTP: "/auth/manager/verify-otp",
    PROFILE: "/auth/profile",
  },
  CRITERIA: {
    LIST: "/criteria",
    CREATE: "/criteria",
    UPDATE: (id) => `/criteria/${id}`,
    DELETE: (id) => `/criteria/${id}`,
    CATEGORIES: "/criteria/categories",
  },
  AUDITS: {
    LIST: "/audits",
    CREATE: "/audits",
    DETAIL: (id) => `/audits/${id}`,
    UPDATE: (id) => `/audits/${id}`,
    DELETE: (id) => `/audits/${id}`,
    REPORT: (token) => `/audits/report/${token}`,
    SIGN: (token) => `/audits/report/${token}/sign`,
    PAY: "/payment/pay",
  },
  OUTLETS: {
    LIST: "/outlets",
    CREATE: "/outlets",
  },
  USERS: {
    LIST: "/users",
    CREATE: "/users",
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  }
};
