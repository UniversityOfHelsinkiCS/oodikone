import { get, getJson } from '../common';

const throwErrors = (res) => {
    if (res.ok === false || res.error) {
        throw res;
    }

    return res;
};

export const getDepartmentSuccess = date => getJson(`/departmentsuccess/?${date}`).then(throwErrors);
