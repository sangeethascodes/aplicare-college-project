import { createContext, useContext, useReducer, useEffect } from 'react';

// 👈 INITIAL STATES
const initialCustomerState = {
    email: '',
    password: '',
    phone: '',
    role: 'user',
    loggedIn: false,
    userId: null,
    fullName: ''
};

const initialTechnicianState = {
    email: '',
    password: '',
    role: 'technician',
    loggedIn: false,
    userId: null,
    fullName: ''
};

const initialAdminState = {
    email: '',
    password: '',
    role: 'admin',
    loggedIn: false,
    userId: null,
    fullName: ''
};

// 👈 REDUCER
const userReducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE_CUSTOMER':
            return { ...state, customer: action.payload };
        case 'UPDATE_TECHNICIAN':
            return { ...state, technician: action.payload };
        case 'UPDATE_ADMIN':
            return { ...state, admin: action.payload };
        case 'SET_USER':
            return {
                ...state,
                customer: action.payload.role === 'user' ? action.payload : state.customer,
                technician: action.payload.role === 'technician' ? action.payload : state.technician,
                admin: action.payload.role === 'admin' ? action.payload : state.admin
            };
        case 'RESET_ALL':
            return {
                customer: initialCustomerState,
                technician: initialTechnicianState,
                admin: initialAdminState
            };
        default:
            return state;
    }
};

// 👈 CONTEXT
const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [state, dispatch] = useReducer(userReducer, {
        customer: initialCustomerState,
        technician: initialTechnicianState,
        admin: initialAdminState
    });

    // 👈 LOAD FROM LOCALSTORAGE ON START
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');
        
        if (token && role && userId) {
            dispatch({
                type: 'SET_USER',
                payload: { loggedIn: true, role, userId }
            });
        }
    }, []);

    const updateCustomer = (data) => dispatch({ type: 'UPDATE_CUSTOMER', payload: data });
    const updateTechnician = (data) => dispatch({ type: 'UPDATE_TECHNICIAN', payload: data });
    const updateAdmin = (data) => dispatch({ type: 'UPDATE_ADMIN', payload: data });
    const setUser = (userData) => dispatch({ type: 'SET_USER', payload: userData });
    const resetAll = () => dispatch({ type: 'RESET_ALL' });

    return (
        <UserContext.Provider value={{
            customerData: state.customer,
            technicianData: state.technician,
            adminData: state.admin,
            updateCustomer,
            updateTechnician,
            updateAdmin,
            setUser,
            resetAll
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserStore = () => useContext(UserContext);
export default UserContext;
