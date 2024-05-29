import * as moment from 'moment';

export const checkUrlExpiration = (expirationTime: number): boolean => {
  const currentTime = moment().unix();
  return expirationTime && expirationTime < currentTime;
};

export const generateRandomAlphaNumeric = (): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const charactersLimit = 4;
  let randomFourCharacters = '';

  for (let i = 0; i < charactersLimit; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomFourCharacters += characters.charAt(randomIndex);
  }

  return randomFourCharacters;
};

export const mapUserAgentToDeviceInfo = (
  userAgent: string,
): { deviceType: string; osType: string; browserType: string } => {
  let deviceType: string;
  let osType: string;
  let browserType: string;

  if (/iPad/i.test(userAgent)) {
    deviceType = 'iPad';
  } else if (/Mobile/i.test(userAgent)) {
    deviceType = 'Mobile';
  } else {
    deviceType = 'Desktop';
  }

  if (/Android/i.test(userAgent)) {
    osType = 'Android';
  } else if (/iPhone/i.test(userAgent)) {
    osType = 'iPhone';
  } else if (/Mac OS/i.test(userAgent)) {
    osType = 'Mac';
  } else if (/Windows/i.test(userAgent)) {
    osType = 'Windows';
  } else {
    osType = 'Unknown';
  }

  if (userAgent.includes('MSIE')) {
    browserType = 'Internet Explorer';
  } else if (userAgent.includes('Firefox')) {
    browserType = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browserType = 'Edge';
  } else if (userAgent.includes('Chrome')) {
    browserType = 'Chrome';
  } else if (userAgent.includes('Safari')) {
    browserType = 'Safari';
  } else {
    browserType = 'Unknown';
  }

  return { deviceType, osType, browserType };
};

export const transformAffiliateData = (affiliates) => {
  return affiliates.map((affiliate: any) => {
    const { validClicks, invalidClicks, profileAddress } = affiliate;
    return {
      profileAddress,
      totalClicks: validClicks + invalidClicks,
      earnings: 0,
    };
  });
};
