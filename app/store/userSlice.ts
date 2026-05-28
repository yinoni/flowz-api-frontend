import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Matches backend UserDTO (password excluded)
export interface UserDTO {
  id: string;
  username: string;
  email: string;
}

// Matches backend AuthenticationRequest
export interface AuthenticationRequest {
  email: string;
  password: string;
}

// Matches backend SignUpRequest
export interface SignUpRequest {
  email: string;
  username: string;
  password: string;
}

interface UserState {
  currentUser: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  currentUser: null,
  token: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ user: UserDTO; token: string }>) {      
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    updateUser(state, action: PayloadAction<Partial<UserDTO>>) {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    logout(state) {
      state.currentUser = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccess, updateUser, logout } = userSlice.actions;
export default userSlice.reducer;
