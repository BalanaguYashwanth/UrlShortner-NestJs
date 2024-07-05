export const ADCAMPAIGN_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'affiliateList',
    outputs: [
      {
        internalType: 'address',
        name: 'affiliateWalletAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'campaignUID',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: 'clicks',
        type: 'uint32',
      },
      {
        internalType: 'uint256',
        name: 'earned',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'campaignURL',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'originalURL',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'campaignList',
    outputs: [
      {
        internalType: 'uint256',
        name: 'budget',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'category',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'campaignName',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'campaignWalletAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'cpc',
        type: 'uint256',
      },
      {
        internalType: 'uint32',
        name: 'endDate',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'startDate',
        type: 'uint32',
      },
      {
        internalType: 'uint8',
        name: 'status',
        type: 'uint8',
      },
      {
        internalType: 'string',
        name: 'originalUrl',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address payable',
        name: 'affiliateAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'affiliateUID',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'campaignUID',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'campaignURL',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'originalURL',
        type: 'string',
      },
    ],
    name: 'createAffiliate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_category',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_campaignName',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'cpc',
        type: 'uint256',
      },
      {
        internalType: 'uint32',
        name: 'endDate',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'startDate',
        type: 'uint32',
      },
      {
        internalType: 'uint8',
        name: 'status',
        type: 'uint8',
      },
      {
        internalType: 'string',
        name: 'originalUrl',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'UID',
        type: 'address',
      },
    ],
    name: 'createCampaign',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'UID',
        type: 'address',
      },
    ],
    name: 'endCampaign',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'UID',
        type: 'address',
      },
    ],
    name: 'getAffiliateById',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'affiliateWalletAddress',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'campaignUID',
            type: 'address',
          },
          {
            internalType: 'uint32',
            name: 'clicks',
            type: 'uint32',
          },
          {
            internalType: 'uint256',
            name: 'earned',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'campaignURL',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'originalURL',
            type: 'string',
          },
        ],
        internalType: 'struct AdCampaign.Affiliate',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'UID',
        type: 'address',
      },
    ],
    name: 'getCampaignById',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'budget',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'category',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'campaignName',
            type: 'string',
          },
          {
            internalType: 'address',
            name: 'campaignWalletAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'cpc',
            type: 'uint256',
          },
          {
            internalType: 'uint32',
            name: 'endDate',
            type: 'uint32',
          },
          {
            internalType: 'uint32',
            name: 'startDate',
            type: 'uint32',
          },
          {
            internalType: 'uint8',
            name: 'status',
            type: 'uint8',
          },
          {
            internalType: 'string',
            name: 'originalUrl',
            type: 'string',
          },
        ],
        internalType: 'struct AdCampaign.Campaign',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getContractTotalAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address payable',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'affiliateUID',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'campaignUID',
        type: 'address',
      },
    ],
    name: 'updateAffiliateActivity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
