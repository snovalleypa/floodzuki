const es = {
  common: {
    ok: "¡Vale!",
    cancel: "Cancelar",
    delete: "Eliminar",
    confirm: "Confirmar",
    save: "Guardar",
    back: "Atrás",
    title: "Red de Medidores Floodzilla",
    subtitle: "Un proyecto de SVPA",
    loading: "Cargando...",
    tel: "tel:",
    email: "correo electrónico:"
  },
  measure: {
    cfs: "cfs",
    ft: "pies",
    hr: "hr",
    feet: "pies",
    hour: "hora",
    max: "Máx"
  },
  status: {
    normal: "Normal",
    nearFlooding: "Cerca de inundación",
    flooding: "Inundación"
  },
  statuses: {
    Offline: "Desconectado",
    Online: "Conectado",
    Normal: "Normal",
    NearFlooding: "Cerca de inundación",
    Flooding: "Inundación",
    Dry: "Seco"
  },
  errorScreen: {
    header: "Vaya...",
    title: "¡Algo salió mal!",
    friendlySubtitle: "Estamos trabajando en el problema.\nMientras tanto, siéntete libre de intentarlo de nuevo.",
    reset: "Intentar de nuevo"
  },
  navigation: {
    homeScreen: "Activo",
    forecastScreen: "Pronóstico",
    alertsScreen: "Alertas",
    profileScreen: "Editar perfil",
    loginScreen: "Iniciar sesión",
    aboutScreen: "Acerca de",
    newAccountScreen: "Crear cuenta",
    passwordForgotScreen: "Olvidé mi contraseña",
    passwordResetScreen: "Restablecer contraseña",
    passwordSetScreen: "Cambiar contraseña",
    passwordCreateScreen: "Elegir contraseña",
    verifyPhoneNnumberScreen: "Verificar número de teléfono",
    changePhoneNnumberScreen: "Cambiar número de teléfono",
    changeemailScreen: "Cambiar dirección de correo electrónico",
    verifyemailScreen: "Verificar dirección de correo electrónico",
    unsubscribeScreen: "Darse de baja",
    privacyPolicyScreen: "Política de privacidad",
    termsOfServiceScreen: "Términos de servicio",
    logout: "Cerrar sesión",
    back: "Volver"
  },
  homeScreen: {
    title: "Río Snoqualmie / SVPA"
  },
  forecastScreen: {
    title: "Pronóstico",
    details: "Detalles",
    viewGage: "Ver medidor",
    latestReading: "Última lectura",
    pastMax: "Máximo en las últimas 24 horas",
    forecastedCrests: "Crestas pronosticadas",
    lastReadings: "Últimas 100 lecturas",
    currentlyForecasted: "Pronóstico actual",
    published: "publicado",
    noaaGage: "Medidor NOAA",
    dataSuppliedBy: "Datos de medidores de inundaciones proporcionados por",
    noaaTitle: "Centro de pronóstico de ríos del noroeste del Servicio Meteorológico Nacional"
  },
  profileScreen: {
    title: "Perfil"
  },
  aboutScreen: {
    manageNotitifications: "Administrar notificaciones de inundaciones",
    logIn: "Iniciar sesión para recibir notificaciones de inundaciones",
    details: "Detalles",
    appVersion: "Versión de la aplicación"
  },
  alertsScreen: {
    title: "Alertas Floodzilla",
    welcomeText: "¡Bienvenido a las Alertas Floodzilla! Le enviaremos alertas por correo electrónico o mensaje de texto SMS cuando detectemos condiciones de inundación. \n\nNecesitamos sus comentarios.",
    letUsKnow: "Háganos saber",
    howWeAreDoing: " cómo lo estamos haciendo",
    editProfile: "Editar perfil",
    logOut: "Cerrar sesión",
    pnsDisabledTitle: "Notificaciones push desactivadas",
    pnsDisabledMessage: "Debe habilitar las notificaciones push en la configuración de su dispositivo para recibir alertas.",
    pnsDisabledButton: "Abrir configuración",
    alertSettings: "Configuración de alertas",
    enablePushNotifications: "Habilitar notificaciones push",
    verifyEmail: "Verifique su dirección de correo electrónico para recibir alertas por correo electrónico",
    sendEmailAlertsTo: "Enviar alertas por correo electrónico a",
    enterPhoneNumber: "Ingrese un número de teléfono",
    toReceiveAlerts: "para recibir alertas SMS",
    sendSmsAlerts: "Enviar alertas por SMS a",
    changePhone: "(Cambiar número de teléfono)",
    emailSent: "Se ha enviado un correo electrónico a {email}. Haga clic en el enlace de ese correo electrónico para verificar su dirección de correo electrónico.",
    verifyEmailTitle: "Verificar dirección de correo electrónico",
    forecasts: "Pronósticos",
    forecastsTitle: "Floodzilla puede enviarte pronósticos de ríos.",
    genericForecast: "Envíame alertas de pronóstico de inundaciones (generalmente una o dos veces al día durante eventos de inundación).",
    dailyForecast: "Envíame pronósticos diarios de estado y crecida de ríos.",
    gageAlerts: "Alertas de medidor",
    gageAlertsTitle: "Avísame sobre cambios de estado para estos medidores:",
    gageAlertsSubtitle: "Habilite uno de los canales de notificaciones (correo electrónico, SMS, notificaciones push) para administrar esta configuración."
  },
  changeemailScreen: {
    newEmailAddress: "Nueva dirección de correo electrónico",
    enterEmail: "Ingrese su correo electrónico",
    button: "Actualizar"
  },
  createpasswordScreen: {
    title: "Para cambiar su dirección de correo electrónico, primero debe crear una contraseña para su cuenta Floodzilla.",
    submit: "Actualizar"
  },
  newScreen: {
    firstName: "Nombre",
    firstNamePlaceholder: "Ingrese su nombre",
    lastName: "Apellido",
    lastNamePlaceholder: "Ingrese su apellido",
    email: "Correo electrónico",
    emailPlaceholder: "Ingrese su correo electrónico",
    password: "Contraseña",
    passwordPlaceholder: "Ingrese su contraseña",
    confirmPassword: "Confirmar contraseña",
    confirmPasswordPlaceholder: "Confirme su contraseña",
    rememberMe: "Recuérdame",
    login: "Iniciar sesión",
    createAccount: "Crear cuenta",
  },
  passwordforgotScreen: {
    description: "Ingresa tu dirección de correo electrónico. Te enviaremos un enlace para que puedas restablecer tu contraseña.",
    emailSent: "Se ha enviado un correo electrónico a {{email}} con un enlace para restablecer tu contraseña.\nSi no hay una cuenta que coincida, no se enviará ningún correo electrónico.",
    email: "Correo electrónico",
    emailPlaceholder: "Ingresa tu correo electrónico",
    submit: "Enviar correo electrónico"
  },
  resetpasswordScreen: {
    successMessage: "¡Listo! Ahora puedes iniciar sesión con tu nueva contraseña.",
    submit: "Actualizar"
  },
  setpasswordScreen: {
    successMessage: "¡Listo! Ahora puedes iniciar sesión con tu nueva contraseña.",
    submit: "Actualizar"
  },
  unsubscribeScreen: {
    errorMessage: "Lo sentimos, pero ha ocurrido un error al procesar tu solicitud de cancelación de suscripción.",
    please: "Por favor",
    contactUs: "contáctanos",
    soWeCanRemove: "para que podamos eliminar tu suscripción.",
    tryAgain: "Intentar de nuevo",
    successMessage: "Te has dado de baja de todas las alertas de Floodzilla.",
    manageAlerts: "Administra tus alertas",
    continue: "Continuar en Floodzilla",
    description: "Si te das de baja, ya no recibirás alertas de Floodzilla en ",
    unsubscribeAll: "Cancelar suscripción a todas las alertas de Floodzilla"
  },
  verifyemailScreen: {
    errorMessage: "Lo sentimos, pero ha ocurrido un error al procesar tu solicitud de verificación de correo electrónico.",
    tryAgain: "Intentar de nuevo",
    successMessage: "Tu dirección de correo electrónico ha sido verificada.",
    continue: "Continuar en Floodzilla"
  },
  verifyphonenumberScreen: {
    sendVerification: "Enviar código de verificación",
    resendVerification: "Reenviar código de verificación",
    description: "Por favor, ingresa un número de teléfono donde Floodzilla pueda enviar alertas por SMS. Floodzilla te enviará un SMS con un código de verificación.",
    phoneNumber: "Número de teléfono",
    confirmationText: "Enviamos un código de verificación a {{phoneNumber}}. Por favor, ingresa el código a continuación.",
    verificationCode: "Código de verificación:",
    verificationCodePlaceholder: "Ingresa el código de verificación",
    submit: "Verificar número de teléfono"
  },
  googlesigninButton: {
    error: "Algo salió mal. Por favor, inténtalo de nuevo.",
    title: "Iniciar sesión con Google"
  },
  changePasswordForm: {
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    proceed: "Haz clic aquí para continuar en Flodzilla"
  },
  validations: {
    passwordsDontMatch: "Las contraseñas no coinciden",
    passwordLength: "La contraseña debe tener al menos {{length}} caracteres",
    presence: "{{fieldName}} no puede estar vacío"
  },
  loginScreen: {
    title: "Inicia sesión o crea una cuenta para recibir notificaciones de inundaciones y otras actualizaciones.",
    email: "Correo electrónico",
    emailPlaceholder: "Ingresa tu correo electrónico",
    password: "Contraseña",
    passwordPlaceholder: "Ingresa tu contraseña",
    passwordForgot: "¿Olvidaste tu contraseña?",
    rememberMe: "Recuérdame",
    createAccount: "Crear cuenta",
    login: "Iniciar sesión",
  },
  forecastChart: {
    observed: "Observado",
    forecast: "Pronóstico",
    floodStage: "Nivel de inundación",
    discharge: "Descarga",
    now: "ahora",
    fullRangeTitle: "Completo",
    rangeDays: "{{days}} días",
    rangeDay: "día",
  },
  gageChart: {
    discharge: "Descarga",
    waterLevel: "Nivel del agua",
    Now: "Ahora",
    dashboardDurationLabel: "hace 48 horas",
  },
  gageScreen: {
    goToUpstreamGage: "Ir al medidor río arriba",
    goToDownstreamGage: "Ir al medidor río abajo",
  },
  calloutReading: {
    lastReading: "Última lectura",
    peak: "Pico",
    waterLevel: "Nivel del agua",
    waterFlow: "Flujo del agua",
    status: "Estado",
    trend: "Tendencia",
    road: "Carretera",
    roadSmall: " carretera",
  },
  gageDetailsChart: {
    discharge: "Descarga",
    waterLevel: "Nivel del agua",
    _selectEvent: "- seleccionar evento -",
    selectEvent: "Seleccionar evento",
    historicalEvents: "Eventos históricos",
    rateOfChange: "Tasa de cambio",
    roadLevel: "Nivel de la carretera",
  },
  gageInfoCard: {
    gageInfo: "Información del medidor",
    gageID: "ID del medidor",
    operatedBy: "Operado por",
    riverMile: "Milla del río",
    usgsWebsite: "Sitio web del USGS",
    gage: "Medidor",
    latitude: "Latitud",
    longitude: "Longitud",
  },
  statusLevelsCard: {
    roadSaddle: "sillín de carretera",
    level: "nivel",
    below: "debajo",
    over: "sobre",
    above: "encima",
    logInToGetAlerts: "Inicia sesión para recibir alertas cuando cambie el estado",
    getAlerts: "Recibir alertas cuando cambie el estado",
    manageAlerts: "Administrar alertas",
    statusLevels: "Niveles de estado",
    Below: "Debajo",
    atAndAbove: "En y por encima",
    predicted: "Pronosticado",
    water: "Agua",
  },
  footer: {
    svpaTitle: "La Alianza para la Preservación del Valle de Snoqualmie",
    description1: "La red de medidores Floodzilla es mantenida por ",
    description2: ". La Alianza para la Preservación del Valle de Snoqualmie es una organización sin fines de lucro 501(c)(3) comprometida en proteger la viabilidad de las granjas, residentes y negocios del hermoso valle del río Snoqualmie. Este sitio es posible gracias a las innumerables horas de trabajo voluntario del equipo local de tecnología, los donantes de SVPA y una generosa subvención del Distrito de Control de Inundaciones del Condado de King.",
    addressLine1: "Dirección física",
    addressLine2: "Correo de EE. UU.",
    copyright: "© Alianza para la Preservación del Valle de Snoqualmie"
  },
  datePicker: {
    startDate: "Fecha de inicio",
    endDate: "Fecha de fin",
    day: "Día",
    month: "Mes",
    year: "Año",
  },
  privacyPolicyScreen: {
  },
  termsOfServiceScreen: {
  },
}
    
export default es
    