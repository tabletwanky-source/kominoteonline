import { PaymentSettings } from '../types/database';

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  id: 'general',
  cashEnabled: true,
  bankTransferEnabled: true,
  bankDepositEnabled: true,
  paypalEnabled: true,
  moncashEnabled: true,
  natcashEnabled: true,
  stripeEnabled: true,

  bankTransfer: {
    enabled: true,
    title: 'Transfè oswa Depo Bank',
    description: 'Fè peman ou sou youn nan kont sa yo. Apre peman an, telechaje resi oswa prèv peman an pou administrasyon an ka verifye li.',
    banks: [
      {
        id: 'bank-banreservas',
        bankName: 'Banreservas',
        accountType: 'Kont Epay',
        accountNumber: '960-469-7671',
        accountHolder: 'Wanky Massenat',
      },
      {
        id: 'bank-bhd',
        bankName: 'Banco BHD',
        accountType: 'Kont Epay',
        accountNumber: '36-475-68-0012',
        accountHolder: 'Wanky Massenat',
      },
    ],
    // Default fallback values
    bankName: 'Banreservas',
    accountType: 'Kont Epay',
    accountNumber: '960-469-7671',
    accountHolder: 'Wanky Massenat',
    instructions: 'Mete non ou ak nimewo kòmand lan oswa kou a kòm referans transfè a.',
  },

  bankDeposit: {
    enabled: true,
    instructions: 'Ale nan nenpòt branch Banreservas oswa Banco BHD, fè yon depo sou youn nan kont nou yo, epi telechaje resi oswa prèv peman an isit la.',
  },

  paypal: {
    enabled: true,
    title: 'PayPal',
    paypalEmail: 'wankymassenat@gmail.com',
    instructions: 'Fè peman an atravè PayPal epi antre nimewo tranzaksyon an oswa telechaje prèv peman an.',
    paymentLink: 'https://paypal.me/wankymassenat',
  },

  moncash: {
    enabled: true,
    title: 'MonCash',
    phone: '+509 34 56 7890',
    accountName: 'Wanky Massenat',
    instructions: 'Voye montan an sou nimewo MonCash sa a, epi antre nimewo telefòn ou te itilize a ak nimewo tranzaksyon an oswa telechaje prèv peman an.',
  },

  natcash: {
    enabled: true,
    title: 'NatCash',
    phone: '+509 40 12 3456',
    accountName: 'Wanky Massenat',
    instructions: 'Voye montan an sou nimewo NatCash sa a, epi antre nimewo telefòn ou te itilize a ak nimewo tranzaksyon an oswa telechaje prèv peman an.',
  },

  stripe: {
    enabled: true,
    title: 'Kat Debi oswa Kat Kredi',
    subtitle: 'Peye an sekirite ak Stripe',
  },

  cash: {
    enabled: true,
    location: 'Delmas 75, Pòtoprens, Ayiti',
    phone: '+509 34 56 7890',
    instructions: 'Pase nan biwo nou an lendi rive vandredi ant 9:00 AM ak 4:00 PM pou depoze kòb la dirèkteman.',
  },
};
