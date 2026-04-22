import React from 'react';
import EmployeeList from '../components/employee/EmployeeList';

const EmployeeListScreen: React.FC = () => {
  return (
    <EmployeeList 
      viewType="full"
      title="Employees"
      showHeader={true}
      showSearch={true}
    />
  );
};

export default EmployeeListScreen;