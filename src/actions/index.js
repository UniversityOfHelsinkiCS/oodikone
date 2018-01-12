import { getDepartmentSuccess } from "../api";

export const GET_DEPARTMENT_SUCCESS = 'GET_DEPARTMENT_SUCCESS';



export const getDepartmentSuccessAction = date => ({
    type: GET_DEPARTMENT_SUCCESS,
    payload: getDepartmentSuccess(date)
});

