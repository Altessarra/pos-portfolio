export const money = (value) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(Number(value || 0));
};

export const dateTime = (value) => {
  return new Date(value).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

export const dateOnly = (value) => {
  return new Date(value).toLocaleDateString('en-PH', {
    dateStyle: 'medium'
  });
};
