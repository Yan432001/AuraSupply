import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const addToCart = (product) => {
    // Generate a unique item key by combining id and selected size/variant
    const variantTag = product.selectedSize || product.selectedVariant?.name || 'standard';
    const itemKey = `${product.id}_${variantTag}`;
    const addQty = product.quantity || 1;

    let updatedCart;
    const existingIndex = cart.findIndex(
      (item) => (item.cartItemId || item.id) === itemKey || (item.id === product.id && item.selectedSize === product.selectedSize)
    );

    if (existingIndex >= 0) {
      updatedCart = cart.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + addQty }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          ...product,
          cartItemId: itemKey,
          quantity: addQty,
        },
      ];
    }

    setCart(updatedCart);
    try {
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch {}
  };

  const updateQuantity = (identifier, quantity) => {
    if (quantity <= 0) {
      removeFromCart(identifier);
    } else {
      const updatedCart = cart.map((item) =>
        (item.cartItemId === identifier || item.id === identifier)
          ? { ...item, quantity }
          : item
      );
      setCart(updatedCart);
      try {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      } catch {}
    }
  };

  const removeFromCart = (identifier) => {
    const updatedCart = cart.filter(
      (item) => item.cartItemId !== identifier && item.id !== identifier
    );
    setCart(updatedCart);
    try {
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch {}
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem('cart');
    } catch {}
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addItem: addToCart,
        updateQuantity,
        removeFromCart,
        removeItem: removeFromCart,
        clearCart,
        cartTotal,
        total: cartTotal,
        cartItemCount,
        itemCount: cartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
