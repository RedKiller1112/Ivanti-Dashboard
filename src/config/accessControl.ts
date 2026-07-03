export type AccessScope = 'region' | 'general';

export interface AccessConfigItem {
  key: string;
  scope: AccessScope;
  region: string | null;
  /**
   * SHA-256 hex digest en minúsculas de la contraseña.
   * Genera con: node -e "const crypto=require('crypto');console.log(crypto.createHash('sha256').update('TU_CLAVE').digest('hex'))"
   */
  passwordHash: string;
}

export const ACCESS_CONFIG: AccessConfigItem[] = [
  { key: 'FISCALIA NACIONAL', scope: 'region', region: 'Fiscalia Nacional', passwordHash: 'dfcb14666dcb8ba5689e308a371d07969b53677d29f31838490e3ca9b42303b1' },
  { key: 'I TARAPACA', scope: 'region', region: 'I Tarapacá', passwordHash: 'a2f69dadeba02a14df415001ce970359bc718ff572382698219edc14101bbf80' },
  { key: 'II ANTOFAGASTA', scope: 'region', region: 'II Antofagasta', passwordHash: '92edb446cf0b2552e1b872ec06c4c1a36c7002b7622f70a6665e735089b58ac4' },
  { key: 'III ATACAMA', scope: 'region', region: 'III Atacama', passwordHash: 'aa4e724346e5a93d8e219f0a198a33935a2ca4fdc0e80e10bf1ce4b4406f1dfe' },
  { key: 'IV COQUIMBO', scope: 'region', region: 'IV Coquimbo', passwordHash: '5a94ba10334e3b84e0841f5cfb53a0e0cd88a0566d6ba366da196618c69ab47a' },
  { key: 'IX LA ARAUCANIA', scope: 'region', region: 'IX La Araucanía', passwordHash: '76c24135e40b54d4fd9e7cd28253da40fb463015244f711bba3cdb70c4fe3ad8' },
  { key: 'RM CENTRO NORTE', scope: 'region', region: 'RM Centro Norte', passwordHash: '260e2d9d29c2c401dd4c14866f138be24d4dd9cc82093348724daab096c38d4f' },
  { key: 'RM OCCIDENTE', scope: 'region', region: 'RM Occidente', passwordHash: 'e23b714895f0bbd12359f61aba4b3b235e38922ee456b69d5833fa9b1506b1ea' },
  { key: 'RM ORIENTE', scope: 'region', region: 'RM Oriente', passwordHash: '28e8458cccd6df2ca94d6a85c2e574dcd70468e737328d5d5687870db4a0f303' },
  { key: 'RM SUR', scope: 'region', region: 'RM Sur', passwordHash: '83c1deb7925ab50046331f793b142cdf420d1ac5a596065fb4185906fb9d9e38' },
  { key: 'V VALPARAISO', scope: 'region', region: 'V Valparaíso', passwordHash: '4173b61bef442e5d81cd2c9d5d9154ca7482d7fbe1f94234034ea3de7bffcc68' },
  { key: "VI O' HIGGINS", scope: 'region', region: "VI O' Higgins", passwordHash: '8abc1aad2972a856ffa2d85f25370be16cf673318c6eee3d7e3a77a18e8794d5' },
  { key: 'VII MAULE', scope: 'region', region: 'VII Maule', passwordHash: '44ed9ff6bbd9266d1d236f19b0e262194d243c9550cf74ca4f080e98a90f1bd7' },
  { key: 'VIII BIOBIO', scope: 'region', region: 'VIII Biobío', passwordHash: '7c52ad97a85abb2ed35583a229cb8575c6c0b88781205485deed4bdf0c721bb2' },
  { key: 'X LOS LAGOS', scope: 'region', region: 'X Los Lagos', passwordHash: '645eb3e4dab22795dff33f63818fbfac9e1ab387f6c141d8325da17fdb996f7c' },
  { key: 'XI AYSEN', scope: 'region', region: 'XI Aysén', passwordHash: '8a636cb061166424dea617716fa91bb24e011d561a7ad9592490051ac6aaf6f4' },
  { key: 'XII MAGALLANES', scope: 'region', region: 'XII Magallanes', passwordHash: '8f8606a8444f29ce0ac4f194bcc43eff281468910796f02dc224250488682a7f' },
  { key: 'XIV LOS RIOS', scope: 'region', region: 'XIV Los Ríos', passwordHash: 'b25ccd7d7a518e3a297c1236cfde05d67609b66389ac9a106034132388185e99' },
  { key: 'XV ARICA Y PARINACOTA', scope: 'region', region: 'XV Arica y Parinacota', passwordHash: '4d8a512a2bb09fc0235cd0f1fb43de7626f420e9034545033a9dc7c790138f2f' },
  { key: 'XVI NUBLE', scope: 'region', region: 'XVI Ñuble', passwordHash: 'a6e8d799e761f84ea58d83e3c6e44a6142d48c7664ac7898b9f606902c052931' },
  { key: 'SIN REGION', scope: 'region', region: 'Sin Región', passwordHash: '04283d01f09dc3e0f720161bf9b6f8d628b75ce7b5df6487b6a2ab28cb2065c1' },
  { key: 'GENERAL', scope: 'general', region: null, passwordHash: '3e23052ed2ccbcb0e53adf909d1ddaa1068da9c92f46d35d785fd4805bd9bb01' }
];

export const ACCESS_SESSION_KEY = 'ivanti_local_access_session';
