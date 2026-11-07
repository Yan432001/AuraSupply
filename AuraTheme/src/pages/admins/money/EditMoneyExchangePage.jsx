import React from 'react';
import { useParams } from 'react-router-dom';
import MoneyExchangeForm from './MoneyExchangeForm';

const EditMoneyExchangePage = () => {
  const { id } = useParams();
  return <MoneyExchangeForm mode="edit" exchangeId={id} />;
};

export default EditMoneyExchangePage;
