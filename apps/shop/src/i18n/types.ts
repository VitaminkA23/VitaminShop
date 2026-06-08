export interface Dictionary {
  nav: {
    home: string;
    cart: string;
    profile: string;
    signOut: string;
    language: string;
  };
  home: {
    title: string;
    subtitle: string;
    noProducts: string;
    noProductsSubtitle: string;
  };
  product: {
    addToCart: string;
    adding: string;
    added: string;
    outOfStock: string;
    likeAdd: string;
    likeRemove: string;
  };
  cart: {
    title: string;
    empty: string;
    emptySubtitle: string;
    browseProducts: string;
    subtotal: string;
    items: string;
    checkout: string;
    backToShop: string;
    each: string;
    decrease: string;
    increase: string;
  };
  checkout: {
    title: string;
    backToCart: string;
    shippingAddress: string;
    paymentMethod: string;
    orderSummary: string;
    shipping: string;
    free: string;
    total: string;
    placeOrder: string;
    placing: string;
    noAddresses: string;
    noCards: string;
    addInProfile: string;
    addAnotherAddress: string;
    addAnotherCard: string;
    addFirst: string;
    profileLink: string;
    defaultBadge: string;
    qty: string;
  };
  profile: {
    title: string;
    backToShop: string;
    addresses: string;
    noAddresses: string;
    addNewAddress: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    setDefault: string;
    saveAddress: string;
    saving: string;
    addressSaved: string;
    paymentMethods: string;
    noCards: string;
    securityNote: string;
    addTestCard: string;
    cardNumber: string;
    expiry: string;
    saveCard: string;
    cardSaved: string;
    defaultBadge: string;
    expires: string;
    testCardHint: string;
  };
  auth: {
    signIn: string;
    welcomeBack: string;
    email: string;
    password: string;
    signingIn: string;
    networkError: string;
  };
  orderSuccess: {
    title: string;
    orderId: string;
    itemsOrdered: string;
    qty: string;
    shipping: string;
    free: string;
    totalPaid: string;
    shipsTo: string;
    continueShopping: string;
    status: string;
    notFound: string;
  };
}