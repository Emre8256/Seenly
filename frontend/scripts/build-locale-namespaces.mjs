import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enDir = path.join(__dirname, '../src/content/locales/en');
const trDir = path.join(__dirname, '../src/content/locales/tr');

// 1. Load existing ui.json
const enUi = JSON.parse(fs.readFileSync(path.join(enDir, 'ui.json'), 'utf8'));
const trUi = JSON.parse(fs.readFileSync(path.join(trDir, 'ui.json'), 'utf8'));

// 2. Define the namespace contents for EN and TR
const enNamespaces = {
  common: {
    next: enUi.next_btn || "Next",
    back: enUi.back_btn || "Back",
    submit: enUi.submit_btn || "Submit",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    close: "Close",
    copy: "Copy",
    copied: enUi.copied_alert || "Link copied!",
    delete: "Delete",
    edit: "Edit",
    share: "Share",
    gotIt: "Got it",
    loading: "Loading...",
    processing: "Processing...",
    viewProfile: enUi.view_profile_btn || "View Profile",
    unknownPerson: enUi.unknown_person || "Unknown Person",
    accuracy: "Accuracy",
    match: "Match",
    timeAgoSuffix: enUi.response_history?.time_ago_suffix || "ago",
    seconds: "seconds",
    minutes: "minutes",
    hours: "hours",
    days: "days",
    oneTime: "One-Time",
    visits: "Visits",
    agreement_strongly_disagree: enUi.agreement_strongly_disagree || "Strongly Disagree",
    agreement_disagree: enUi.agreement_disagree || "Disagree",
    agreement_neutral: enUi.agreement_neutral || "Not Sure",
    agreement_agree: enUi.agreement_agree || "Agree",
    agreement_strongly_agree: enUi.agreement_strongly_agree || "Strongly Agree",
    signals: {
      samimiyet: enUi.label_samimiyet || "Sincerity",
      cekicilik: enUi.label_cekicilik || "Charm",
      zeka: enUi.label_zeka || "Intellect",
      vizyon: enUi.label_vizyon || "Vision",
      enerji: enUi.label_enerji || "Energy",
      guvenilirlik: enUi.label_guvenilirlik || "Reliability",
      ego: enUi.label_ego || "Ego",
      basari: enUi.label_basari || "Success",
      comertlik: enUi.label_comertlik || "Generosity",
      olgunluk: enUi.label_olgunluk || "Maturity"
    },
    signalDescriptions: {
      samimiyet: enUi.desc_samimiyet || "",
      cekicilik: enUi.desc_cekicilik || "",
      zeka: enUi.desc_zeka || "",
      vizyon: enUi.desc_vizyon || "",
      enerji: enUi.desc_enerji || "",
      guvenilirlik: enUi.desc_guvenilirlik || "",
      ego: enUi.desc_ego || "",
      basari: enUi.desc_basari || "",
      comertlik: enUi.desc_comertlik || "",
      olgunluk: enUi.desc_olgunluk || ""
    },
    rarity: {
      common: "Common",
      elite: "Elite",
      rare: "Rare",
      unique: "Unique"
    },
    strength_strong: enUi.strength_strong || "Distinct Divergence",
    strength_clear: enUi.strength_clear || "Clear Difference",
    strength_subtle: enUi.strength_subtle || "Subtle Mismatch",
    conf_forming: enUi.conf_forming || "Forming",
    conf_outside_open: enUi.conf_outside_open || "Clarifying",
    conf_gap_open: enUi.conf_gap_open || "Clear",
    conf_stronger_signal: enUi.conf_stronger_signal || "Crystallized",
    confidence_band_label: enUi.confidence_band_label || "Signal Strength",
    capacity_full_label: enUi.capacity_full_label || "Capacity Full",
    full_signal_label: enUi.full_signal_label || "Full Signal"
  },

  navigation: {
    dashboard: enUi.nav_dashboard || "Dashboard",
    settings: enUi.nav_settings || "Profile",
    packages: enUi.nav_packages || "10Signal Plus",
    start: enUi.nav_start || "Start Quiz",
    login: enUi.nav_login || "Log In",
    logout: enUi.nav_logout || "Log Out",
    howItWorks: enUi.nav_how_it_works || "How It Works",
    socialIdentities: enUi.nav_social_identities || "Social Identities",
    plans: enUi.nav_plans || "Plans",
    faq: enUi.nav_faq || "FAQ",
    backHome: "Back to Home",
    goBack: "Go Back",
    footer: {
      quickLinks: enUi.footer_quick_links || "Explore",
      support: enUi.footer_support || "Support & Info",
      privacy: enUi.footer_privacy || "Privacy Policy",
      privacyPolicy: enUi.footer_privacy_policy || "Privacy Policy",
      terms: enUi.footer_terms_of_use || "Terms & Conditions",
      contact: enUi.footer_contact || "Contact",
      contactUs: enUi.footer_contact_us || "Contact",
      description: enUi.landing_footer_desc || "10Signal is designed with care to help people understand themselves and each other better.",
      rights: enUi.landing_footer_rights || "10Signal. All rights reserved.",
      slogan: enUi.landing_footer_slogan || "See yourself"
    }
  },

  home: {
    hero: {
      tag: enUi.landing_hero_tag || "Social self-awareness experience",
      title1: enUi.landing_hero_title_1 || "Discover how people ",
      titleItalic: enUi.landing_hero_title_italic || "experience",
      title2: enUi.landing_hero_title_2 || " you.",
      desc: enUi.landing_hero_desc || "Compare how you see yourself with how people who know you experience you. 10Signal makes the common signals and differences between your self-perception and outside perception visible.",
      ctaFree: enUi.landing_hero_cta_free || "Start free · See your first results in minutes",
      startCta: enUi.landing_start_cta || "Start your 10Signal",
      quickLogin: enUi.landing_quick_login || "Sign In",
      caption: enUi.landing_hero_caption || "Same table, different perspectives",
      badge: enUi.badge_text || "10 SOCIAL SIGNALS. REAL ANSWERS.",
      anonymousNoSignup: enUi.anonymous_no_signup || "Anonymous. No signup required.",
      socialProof: enUi.social_proof_answers || "1.5K+ people answered"
    },
    stats: {
      stat1Val: enUi.landing_stats_1_val || "1.2K+",
      stat1Lbl: enUi.landing_stats_1_lbl || "Profiles Created",
      stat2Val: enUi.landing_stats_2_val || "15K+",
      stat2Lbl: enUi.landing_stats_2_lbl || "Shared Responses",
      stat3Val: enUi.landing_stats_3_val || "240K+",
      stat3Lbl: enUi.landing_stats_3_lbl || "Total Perception Signals",
      stat4Val: enUi.landing_stats_4_val || "89.4%",
      stat4Lbl: enUi.landing_stats_4_lbl || "Analysis Consistency"
    },
    opening: {
      tag: enUi.landing_opening_tag || "Opening",
      quote: enUi.landing_opening_quote || "We think we know ourselves. But people who know us often carry something we cannot see: ",
      quoteItalic: enUi.landing_opening_quote_italic || "how we look through their eyes.",
      desc: enUi.landing_opening_desc || "10Signal is not a test. It doesn't box you in. Instead, it places your own narrative side by side with the silent observations of your close circle — and opens up a space for you to see yourself in that subtle gap."
    },
    experience: {
      tag: enUi.landing_hiw_tag || "Experience",
      title: enUi.landing_hiw_title || "A reading in three movements.",
      desc: enUi.landing_hiw_desc || "First, you tell your story. Then, your circle contributes silently. The final movement is where the two meet.",
      m1Title: enUi.landing_hiw_m1_turkish || "Your own narrative",
      m1Text: enUi.landing_hiw_m1_text || "You share how you see yourself right now in your own thoughts. This is your starting point.",
      m2Title: enUi.landing_hiw_m2_turkish || "The voice from outside",
      m2Text: enUi.landing_hiw_m2_text || "People who know you contribute anonymously. It's not individual answers that matter, but repeating common signals.",
      m3Title: enUi.landing_hiw_m3_turkish || "The gap in between",
      m3Text: enUi.landing_hiw_m3_text || "Your self-perception and outside perception come together. You see where you align and where you diverge."
    },
    contexts: {
      tag: enUi.landing_cases_tag || "Contexts",
      title: enUi.landing_cases_title || "10Signal is not just a test.",
      desc: enUi.landing_cases_desc || "You can explore how people experience you in different scenes of your life.",
      c1Plate: enUi.landing_case_1_plate || "Digital Reflection",
      c1Title: enUi.landing_case_1_title || "On your social profile",
      c1Text: enUi.landing_case_1_text || "Add the 10Signal link to your profile. Let people see how you present yourself and how you are experienced.",
      c2Plate: enUi.landing_case_2_plate || "Social Dynamic",
      c2Title: enUi.landing_case_2_title || "In your friend group",
      c2Text: enUi.landing_case_2_text || "Get feedback from your close circle and explore the common signals that connect you.",
      c3Plate: enUi.landing_case_3_plate || "First Impression",
      c3Title: enUi.landing_case_3_title || "In new connections",
      c3Text: enUi.landing_case_3_text || "Examine the relationship between first impressions and how you see yourself."
    },
    howItWorks: {
      tag: enUi.landing_ex_tag || "HOW IT WORKS",
      title: enUi.landing_ex_title || "10Signal in 3 Steps",
      desc: enUi.landing_ex_desc || "Bringing your self-perception and outside observations together in 3 simple steps:",
      s1Title: enUi.landing_ex_b1_title || "01 / Define Your Self",
      s1Text: enUi.landing_ex_b1_text || "Complete a quick self-assessment to shape your narrative and get your digital Self card.",
      s2Title: enUi.landing_ex_b2_title || "02 / Share Your Link",
      s2Text: enUi.landing_ex_b2_text || "Share your custom link on social media or with friends to gather anonymous feedback.",
      s3Title: enUi.landing_ex_b3_title || "03 / Track Live Results",
      s3Text: enUi.landing_ex_b3_text || "Watch your dashboard update live as responses roll in, showing where you align or diverge."
    },
    layers: {
      tag: enUi.landing_layers_tag || "Layers",
      title: enUi.landing_layers_title || "Results consist of four layers.",
      desc: enUi.landing_layers_desc || "Each layer is based on an explainable dimension measured by 10Signal. Together, they tell how you see yourself and how people experience you.",
      l1Desc: enUi.landing_layers_l1_desc || "The self-perception layer showing how you describe yourself right now.",
      l2Desc: enUi.landing_layers_l2_desc || "A summary of repeating common signals in people who know you.",
      l3Desc: enUi.landing_layers_l3_desc || "Common and diverging aspects between self-perception and outside perception.",
      l4Desc: enUi.landing_layers_l4_desc || "Reflects how you read people when you contribute to a friend."
    },
    collection: {
      tag: enUi.landing_codes_tag || "Collection",
      cardHeader: enUi.landing_codes_card_header || "Social Identity",
      title: enUi.landing_codes_title || "Every result has its own language.",
      desc: enUi.landing_codes_desc || "10Signal results are not just a description; they offer a shareable identity and a collection piece to explore.",
      viewAll: enUi.landing_codes_view_all || "Explore All Social Identities"
    },
    security: {
      tag: enUi.landing_security_tag || "Trust",
      title: enUi.landing_security_title || "Designed to be secure.",
      p1Title: enUi.landing_security_p1_title || "Absolute Anonymity",
      p1Text: enUi.landing_security_p1_text || "Participant identities are completely hidden, individual answers are never shown.",
      p2Title: enUi.landing_security_p2_title || "Shared Signals",
      p2Text: enUi.landing_security_p2_text || "Results are generated only from repeating common data, not single inputs.",
      p3Title: enUi.landing_security_p3_title || "Protected Data",
      p3Text: enUi.landing_security_p3_text || "Your perception data is never shared with third parties or commercialized."
    },
    finalCta: {
      title: enUi.landing_final_title || "Compare how you see yourself and how people experience you.",
      desc: enUi.landing_final_desc || "Start your 10Signal experience and discover the common signals seen by people who know you."
    }
  },

  auth: {
    modalNameTitle: enUi.modal_name_title || "Create your 10Signal",
    modalNameSubtitle: enUi.modal_name_subtitle || "What should we call you? Enter a name to start your quiz.",
    modalNamePlaceholder: enUi.modal_name_placeholder || "display name / name",
    loginTitle: enUi.email_entry_quick_login_title || "Quick Login",
    newProfileTitle: enUi.email_entry_new_profile_title || "New Profile",
    loginDesc: enUi.email_entry_quick_login_desc || "Enter your registered email address to access your profile and reflection.",
    newProfileDesc: enUi.email_entry_new_profile_desc || "Enter your email address to create your social mirror profile and get started.",
    emailPlaceholder: enUi.auth_mail_placeholder || "Your email address",
    sendCodeBtn: enUi.auth_mail_btn || "Send Code",
    otpTitle: enUi.auth_otp_title || "Verify Email",
    otpDesc: enUi.auth_otp_desc || "Enter the 4-digit code we sent to {email}.",
    otpPlaceholder: enUi.auth_otp_placeholder || "0 0 0 0",
    verifyBtn: enUi.auth_otp_btn || "Reveal My Identity",
    resendCountdown: enUi.auth_resend_countdown || "Resend code in: {time}",
    resendBtn: enUi.auth_resend_btn || "Resend Code",
    changeEmailBtn: enUi.auth_change_email || "Change Email Address",
    codeSent: enUi.auth_notification_sent || "Verification code sent to your email.",
    verificationSuccess: enUi.auth_notification_success || "Identity verified, revealing your analysis...",
    invalidCode: enUi.auth_notification_error || "Invalid code. Please try again.",
    accountNotFound: "Account Not Found",
    accountExists: "Account Already Exists",
    claimTitle: enUi.auth_mail_title || "One last step",
    claimDesc: enUi.auth_mail_desc || "Enter your email to seal your social identity, secure your account, and generate your unique sharing link.",
    contactChannel: "YOUR CONTACT CHANNEL",
    verificationCodeHeader: "VERIFICATION CODE",
    verificationDigit: "Verification digit {index}",
    emailAddressLabel: "Email address"
  },

  quiz: {
    onboarding: {
      nameTitle: enUi.wizard_nickname_title || "What should we call you?",
      namePlaceholder: enUi.wizard_nickname_placeholder || "Your name",
      languageTitle: enUi.wizard_language_title || "Choose your language",
      infoTitle: enUi.wizard_info_title || "Before you begin",
      infoBullet1: enUi.wizard_info_bullet1 || "Takes about 60 seconds",
      infoBullet2: enUi.wizard_info_bullet2 || "There are no right or wrong answers",
      infoBullet3: enUi.wizard_info_bullet3 || "All questions must be answered",
      infoCta: enUi.wizard_info_cta || "Let's go",
      startTest: "Start Test"
    },
    runner: {
      chooseAvatarTitle: "Choose Your Avatar",
      chooseAvatarSubtitle: "Select an avatar that represents your presence.",
      avatarWomen: "Women (6)",
      avatarMen: "Men (6)",
      questionCounter: "Question {current} of {total}",
      progressAria: "Quiz progress: Question {current} of {total}"
    },
    results: {
      resultTitle: enUi.result_title || "Your Self Reflection",
      kicker: enUi.test_result_kicker || "YOUR RESULT",
      signatureLabel: enUi.result_signature_label || "Social Signature",
      strongestTrait: enUi.insight_strongest_label || "Strongest trait",
      weakestTrait: enUi.insight_calmest_label || "Subtle trait",
      motivation: enUi.insight_motivation_label || "Motivation",
      shareSuite: "SHARE SUITE",
      shareYourResult: "Share Your Result",
      downloadStory: "Download story card & share",
      sendDirect: "Send direct invite to friends",
      copyLink: "Copy Link",
      copiedLink: "Link Copied!",
      copyProfileLink: "Copy profile link to clipboard",
      inviteFriendsTitle: enUi.invite_friends_title || "Invite Friends to Reveal Outside Read",
      inviteFriendsDesc: enUi.invite_friends_desc || "Send this link to friends. When 3 answer, you unlock your Outside 10Signal and The Gap.",
      copyFriendLink: enUi.copy_link_btn || "Copy Friend Link",
      viewProfileBtn: enUi.view_profile_btn || "View Profile"
    },
    identities: {
      title: enUi.identities_title || "Social Identities",
      subtitle: enUi.identities_subtitle || "45 unique social signatures born from the combination of 10 social signals. Explore the cards to discover your reflection and the prints you leave behind.",
      searchPlaceholder: enUi.identities_search_placeholder || "Search identities...",
      filterAll: enUi.identities_filter_all || "All",
      analysisTitle: enUi.identities_analysis_title || "Identity Analysis",
      ctaDiscover: enUi.identities_cta_discover || "Discover This Role in Yourself",
      descTemplate: enUi.identities_desc_template || "In social perception, this character {d1} At the same time, this profile {d2} The synergy of these two dominant traits makes you a distinct and highly respected signature in your social circles. Others feel this compelling blend and admire the dual depth you naturally radiate.",
      families: {
        stratega: enUi.family_stratega || "Stratega",
        imperia: enUi.family_imperia || "Imperia",
        aura: enUi.family_aura || "Aura",
        porta: enUi.family_porta || "Porta",
        gratia: enUi.family_gratia || "Gratia"
      }
    }
  },

  participant: {
    intro: {
      title: enUi.friend_intro_title || "Read Your Friend",
      desc: enUi.friend_intro_desc || "Go beyond casual social interactions. Evaluate your friend's social energy, presence, and boundaries. This quiz is anonymous; your individual answers will never be shared directly.",
      question: "How are they perceived in the eyes of others?",
      nicknameLabel: enUi.friend_nickname_label || "Enter a nickname (Optional)",
      startBtn: enUi.friend_start_btn || "Start Evaluation",
      evaluatedTitle: "Evaluation Completed",
      evaluatedDesc: "You have successfully shared your perspective for this person. Thank you for your contribution.",
      cappedTitle: "Respondent Capacity Full",
      cappedDesc: "{name}'s profile has reached its maximum participant limit.",
      responseCount_one: "{count} Response",
      responseCount_other: "{count} Responses"
    },
    quiz: {
      quizTitle: enUi.friend_quiz_title || "Friend Evaluation Quiz",
      privacyNote: enUi.privacy_note || "No one is exposed. Individual answers are never shown."
    },
    result: {
      resultTitle: enUi.friend_result_title || "Perception Reflected",
      completedTitle: "Analysis Complete!",
      completedDesc: "You have reflected your friend through your eyes. The analytical engine calculated your reading style based on your signals.",
      readingStyleLabel: enUi.friend_style_label || "Your Social Reading Style",
      accuracyScore: enUi.friend_accuracy_score || "Perception Accuracy",
      accuracyDesc: enUi.friend_accuracy_desc || "The matching rate between how they see themselves and how you read them.",
      accuracyWord: "ACCURACY",
      shareWhatsApp: "Share WhatsApp",
      saveStory: "Save / Create Story",
      startOwnTitle: enUi.friend_cta_title || "What is your social signature?",
      startOwnDesc: enUi.friend_cta_desc || "Start your own quiz to compare how you see yourself against how friends read you.",
      startOwnBtn: enUi.friend_create_own_btn || "Create Your Own 10Signal",
      goToDashboardTitle: enUi.friend_cta_title_loggedin || "See how others read you",
      goToDashboardDesc: enUi.friend_cta_desc_loggedin || "You just read a friend. Now go back to your dashboard and discover how others are reading you in return.",
      goToDashboardBtn: enUi.friend_goto_dashboard_btn || "Go to My Profile"
    },
    share: {
      whatsAppText: "A slice from the Subconscious Archive: My aura through the eyes of my circle took shape as '{cardName}'. What is my reflection in your world? See behind the mirror: {url}",
      storyReadyTitle: "Story Ready!",
      storyReadyDesc: "Your story image has been downloaded. To add a clickable link:",
      step1: "1. Open Instagram and create a new Story",
      step2: "2. Add the downloaded image as background",
      step3: "3. Tap the sticker icon → \"Link\" sticker",
      step4: "4. Paste your 10Signal link",
      storyCopyLink: "Copy",
      storyCopied: "Copied ✓",
      storyGotIt: "Got it",
      storyTagline: "THE SUBCONSCIOUS ARCHIVE",
      storyQuote: "\"How am I reflected in your world?\""
    }
  },

  dashboard: {
    title: enUi.dashboard_title || "Your Social Reflection",
    signalsFormingTitle: enUi.signals_forming_title || "Signals Forming",
    signalsFormingDesc: enUi.signals_forming_desc || "Your profile is live. Share the link for friends to read you. Outside 10Signal and The Gap unlock at 3 responses.",
    lockedSectionTitle: enUi.locked_section_title || "Observation Awaiting",
    lockedSectionOutsideDesc: enUi.locked_section_outside_desc || "Requires 3 friend responses to unlock your Outside 10Signal analysis.",
    lockedSectionGapDesc: enUi.locked_section_gap_desc || "Requires 3 friend responses to reveal the alignment gap (The Gap) between self and outer perceptions.",
    inspectProfile: enUi.inspect_profile || "Inspect Profile",
    tabs: {
      self: enUi.self_view_title || "Self Perception",
      outside: enUi.outside_view_title || "Outside Perception",
      gap: enUi.gap_analysis_title || "The Alignment Gap (The Gap)",
      responses: enUi.response_history?.menu_title || "Received Analytics",
      decisionTimes: enUi.rhythmic_analysis?.menu_title || "Thought Flow"
    },
    self: {
      title: enUi.self_view_title || "Self Perception",
      viewDetailed: "View Detailed Analysis"
    },
    outside: {
      title: enUi.outside_view_title || "Outside Perception",
      totalObservations: enUi.responses_received || "Total Observations",
      viewDetailed: "View Detailed Analysis"
    },
    gap: {
      title: enUi.gap_analysis_title || "The Alignment Gap (The Gap)",
      strengthLabel: enUi.gap_strength_label || "Divergence Intensity",
      blindSpotTitle: enUi.gap_blind_spot_title || "The Blind Spot",
      blindSpotDesc: enUi.gap_blind_spot_desc || "Your circle perceives your {category} significantly higher than you rate yourself. This trait projects outward stronger than you realize.",
      illusionTitle: enUi.gap_illusion_title || "The Social Mask",
      illusionDesc: enUi.gap_illusion_desc || "While you feel {category} strongly internally, you project it more subtly to others. This potential may not be fully visible to your circle.",
      alignmentTitle: enUi.gap_alignment_title || "Deep Alignment",
      alignmentDesc: enUi.gap_alignment_desc || "{category} is where your self-perception and outside observations are closest to each other. You project a balanced, authentic, and natural presence in this dimension.",
      legendSelf: enUi.gap_legend_self || "Self",
      legendFriend: enUi.gap_legend_friend || "Friend",
      tooltipSelf: enUi.gap_tooltip_self || "Self: {value}%",
      tooltipFriend: enUi.gap_tooltip_friend || "Friends: {value}%",
      comparisonTitle: "Perception Comparison",
      howYouSeeYourself: "How You See Yourself",
      howFriendsSeeYou: "How Friends See You",
      gapBadge: "GAP",
      insightTitle: "Gap Analysis Insight",
      insightDesc: "This gap represents the unique intersection between your inner self-perception and the social signals you radiate to the outside world. Rather than a misalignment, it highlights the hidden, authentic impact you leave on others.",
      editorialSelfLow: enUi.gap_editorial_self_low || "minimal and calm",
      editorialSelfMedium: enUi.gap_editorial_self_medium || "balanced and moderate",
      editorialSelfHigh: enUi.gap_editorial_self_high || "dominant and intense",
      editorialFriendLow: enUi.gap_editorial_friend_low || "subtle",
      editorialFriendMedium: enUi.gap_editorial_friend_medium || "balanced and apparent",
      editorialFriendHigh: enUi.gap_editorial_friend_high || "at its peak and intense",
      illusionSelfLow: enUi.gap_illusion_self_low || "calm",
      illusionSelfMedium: enUi.gap_illusion_self_medium || "balanced and apparent",
      illusionSelfHigh: enUi.gap_illusion_self_high || "dominant and at its peak",
      illusionFriendLow: enUi.gap_illusion_friend_low || "minimal and subtle",
      illusionFriendMedium: enUi.gap_illusion_friend_medium || "balanced and moderate",
      illusionFriendHigh: enUi.gap_illusion_friend_high || "intense and apparent",
      alignLevelLow: enUi.gap_align_level_low || "calm and subtle",
      alignLevelMedium: enUi.gap_align_level_medium || "balanced and moderate",
      alignLevelHigh: enUi.gap_align_level_high || "at its peak and highly intense",
      contrastBlindSpotHigh: enUi.gap_contrast_blind_spot_high || "reflects outwards far beyond your expectations",
      contrastBlindSpotLow: enUi.gap_contrast_blind_spot_low || "stands out with a more noticeable presence compared to your self-view",
      contrastIllusionHigh: enUi.gap_contrast_illusion_high || "projecting a much calmer presence externally compared to your rich inner world",
      contrastIllusionLow: enUi.gap_contrast_illusion_low || "projecting it in a slightly more balanced and subtle manner to the outside world",
      matchAlignment: enUi.gap_match_alignment || "matched perfectly"
    },
    decisionTimes: {
      lockedTitle: "Pondering Rhythms Locked",
      lockedDesc: "Discover which questions your friends hesitated on the most, profile visits, and cognitive decision times with 10Signal Plus.",
      unlockPlus: "Unlock with Plus",
      profileVisitsTitle: "Profile Visits & Silent Viewers",
      profileVisitsDesc: "Analyzes the response rate and the initial impression left on people who visited your link.",
      visits: "Visits",
      conversion: "Conversion",
      longestHesitation: "LONGEST HESITATION",
      instantConviction: "INSTANT CONVICTION",
      lockedSignal: "Locked Signal",
      averagePause: "average pause",
      rhythmicAnalysisTitle: enUi.rhythmic_analysis?.menu_title || "Thought Flow",
      hesitatingTitle: enUi.rhythmic_analysis?.hesitating_title || "Enigma Threshold",
      hesitatingDesc: enUi.rhythmic_analysis?.hesitating_desc || "When people completed this analysis about you, they spent the longest time pondering questions focused on {signal}. This indicates that this trait does not reflect as a simple, uniform line to the outside world. This aspect of your personality sparks deep curiosity, making it the domain they contemplated most before deciding.",
      confidentTitle: enUi.rhythmic_analysis?.confident_title || "Natural Projection",
      confidentDesc: enUi.rhythmic_analysis?.confident_desc || "Your friends navigated through questions regarding {signal} within milliseconds without a single hesitation. Your projection in this area is so clear and indisputable to the outside world that your circle validated this power instantly, requiring no secondary thought."
    },
    responses: {
      tabTitle: enUi.response_history?.menu_title || "Received Analytics",
      tabDesc: enUi.response_history?.tab_desc || "Chronological feed of anonymous individual analyses left by your friends.",
      empty: "No responses yet. Share your profile link to get your first signals.",
      lockDesc: enUi.response_history?.lock_desc || "Upgrade to Plus to view this response detail, signal scores, and timing analysis.",
      lockWarning: enUi.response_history?.lock_warning || "Privacy Guard: Even if you unlock this analysis, the identity of the voter remains hidden. All reflections are completely anonymous.",
      drawerClose: "Close dialog",
      individualAnalysis: "INDIVIDUAL ANALYSIS",
      individualReflectionDetail: "INDIVIDUAL REFLECTION DETAIL",
      matchRate: "{accuracy}% Match",
      answersAcrossQuestions: "Individual answers across all 10 questions",
      decisionDurations: "Exact thought and decision durations",
      archetypeDeviations: "Social signal and archetype deviations",
      unlockDetailsWithPlus: "Unlock Details with Plus",
      signalsDistributionTitle: "10 Social Signal Distribution",
      signalsDistributionDesc: "Signals read by this respondent across questions:",
      cognitiveRhythmTitle: "Cognitive Decision Rhythm",
      cognitiveRhythmDesc: "Where did they spend the most and least time?",
      longestPause: "Longest Pause",
      fastestAnswer: "Fastest Answer"
    },
    qr: {
      modalTitle: "Scan to Read",
      modalDesc: "Have people scan this code to complete your reflection quiz directly on their phones.",
      copyLink: "Copy Link",
      copied: "Copied!",
      close: "Close"
    }
  },

  settings: {
    profile: {
      tabTitle: "Profile Settings",
      avatarTitle: "Profile Avatar",
      avatarSaved: "Saved",
      avatarSaving: "Saving...",
      avatarSubtitle: "Choose an avatar that represents your visual presence.",
      changeAvatar: "Change Avatar",
      closeAvatar: "Close",
      womenCategory: "Women (6)",
      menCategory: "Men (6)",
      displayNameTitle: "Display Name",
      displayNameDesc: "Your public name shown on reflection invitations and cards.",
      saveName: "Save",
      emailTitle: "Account Email",
      emailDesc: "Used for secure login and account recovery.",
      changeEmail: "Change Email",
      nameCooldownNote: "After changing your display name, you must wait 14 days before changing it again."
    },
    security: {
      tabTitle: "Notifications & Security",
      emailNotifsTitle: "Email Notifications",
      emailNotifsDesc: "Manage which notifications you receive to your email address.",
      turnOff: "Turn Off",
      turnOn: "Turn On",
      newEvaluationsTitle: "New Evaluations",
      newEvaluationsDesc: "Instant alerts when someone completes your reflection quiz.",
      reportMilestonesTitle: "Report & Milestone Alerts",
      reportMilestonesDesc: "Notifications when you reach 3, 5, 10 responses and unlock features.",
      weeklyDigestTitle: "Weekly Digest",
      weeklyDigestDesc: "Summary of profile traffic and recent impression updates.",
      productUpdatesTitle: "Product Updates & News",
      productUpdatesDesc: "New features, social identities, and platform announcements."
    },
    subscription: {
      tabTitle: "Plans & Capacity",
      quotaTitle: "Participant Quota",
      quotaDesc: "Number of responses you can collect from friends.",
      responsesCollected: "Responses",
      plusActiveTitle: "10Signal Plus is Active",
      plusActiveDesc: "All advanced features and unlimited participant capacity are unlocked for this profile.",
      viewBenefits: "View Benefits",
      hideBenefits: "Hide Benefits",
      unlimitedCapacity: "Unlimited Respondent Capacity",
      unlimitedCapacityDesc: "Collect unlimited feedback without any response limits",
      individualBreakdowns: "Individual Analysis Breakdowns",
      individualBreakdownsDesc: "View 10-signal scores and detailed answer breakdowns",
      decisionTimes: "Question Decision Times",
      decisionTimesDesc: "See the most and least contemplated questions",
      profileVisits: "Profile Visit Analytics",
      profileVisitsDesc: "Track visitor volume and response conversion rates",
      upgradePlusTitle: "Upgrade to 10Signal Plus",
      upgradePlusDesc: "Unlock all deep insights, individual analysis details, and unlimited participant capacity.",
      securePayment: "256-Bit SSL Secure Payment",
      upgradeBtn: "Upgrade to Plus ({price})",
      expandCapacityTitle: "Expand Response Capacity Only",
      expandCapacityDesc: "Add standalone respondent capacity packs to collect more feedback.",
      quotaText: "Quota",
      addPackBtn: "Add Pack",
      addingPack: "Adding...",
      processing: "Processing..."
    },
    deleteAccount: {
      deleteAccountBtn: enUi.delete_account || "Delete Account",
      confirmDialog: "Are you sure you want to delete your account and all associated data? This action cannot be undone.",
      successAlert: "Your account has been successfully deleted."
    },
    modal: {
      close: "Close dialog",
      verifyEmailTitle: "Verify your email address",
      confirmNameTitle: "Confirm name change",
      verifyEmailDesc: "Enter the 4-digit code sent to {email}.",
      confirmNameDesc: "After changing your display name, you will not be able to change it again for 14 days. Are you sure you want to continue?",
      otpDigitAria: "Verification code digit {index}",
      verifyAndUpdate: "Verify and Update",
      confirmAndUpdate: "Confirm and Update",
      cancel: "Cancel",
      incompleteOtpError: "Please enter the complete 4-digit code.",
      verifyFailedError: "Unable to verify the action.",
      paymentUnavailable: "Payment is currently unavailable."
    }
  },

  billing: {
    sectionTitleHtml: enUi.pricing_section_title_html || "Go deeper with<br>Full 10Signal",
    plansSubtitle: enUi.plans_subtitle || "Choose the best plan to explore your character, relationships, and social aura in greater depth.",
    badgePopular: enUi.pricing_badge_popular || "MOST POPULAR",
    disclaimer1: enUi.pricing_disclaimer_1 || "Checkout is not open yet. No payment will be taken.",
    disclaimer2: enUi.pricing_disclaimer_2 || "Anonymous stays protected. No fake answers.",
    getStarted: enUi.pricing_btn_get_started || "Get Started",
    choosePlan: enUi.pricing_btn_choose_plan || "Choose Plan",
    free: {
      name: enUi.pricing_plan_free_name || "Close Circle",
      price: enUi.pricing_plan_free_price || "Free",
      f1: enUi.pricing_plan_free_f1 || "10 Social Signals",
      f2: enUi.pricing_plan_free_f2 || "Up to 10 answers",
      f3: enUi.pricing_plan_free_f3 || "First signals at 3 responses",
      f4: enUi.pricing_plan_free_f4 || "Outside 10Signal ready",
      f5: enUi.pricing_plan_free_f5 || "Shareable link",
      f6: enUi.pricing_plan_free_f6 || "No login required"
    },
    premium: {
      name: enUi.pricing_plan_premium_name || "Full 10Signal",
      price: enUi.pricing_plan_premium_price || "$2.99",
      f1: enUi.pricing_plan_premium_f1 || "Everything in free",
      f2: enUi.pricing_plan_premium_f2 || "Deep Gap view",
      f3: enUi.pricing_plan_premium_f3 || "Hidden Signal",
      f4: enUi.pricing_plan_premium_f4 || "Social Pull",
      f5: enUi.pricing_plan_premium_f5 || "Morsed",
      f6: enUi.pricing_plan_premium_f6 || "10 Signal Breakdown",
      f7: enUi.pricing_plan_premium_f7 || "Premium Share Pack"
    },
    pro: {
      name: enUi.pricing_plan_pro_name || "Story Rush",
      price: enUi.pricing_plan_pro_price || "$14.99",
      f1: enUi.pricing_plan_pro_f1 || "Everything in Full",
      f2: enUi.pricing_plan_pro_f2 || "Priority in room",
      f3: enUi.pricing_plan_pro_f3 || "Fast story drops",
      f4: enUi.pricing_plan_pro_f4 || "9 fit premium cards",
      f5: enUi.pricing_plan_pro_f5 || "Export styles"
    }
  },

  errors: {
    status_401: "Session expired. Please log in again.",
    status_403: "Access denied or verification required.",
    status_404: "The requested resource was not found.",
    status_409: "An account with this information already exists.",
    status_429: "Too many requests. Please slow down and try again.",
    status_500: "Server error occurred. Please try again later.",
    status_503: "Service temporarily unavailable. Please try again shortly.",
    network: "Unable to connect to the server. Please check your internet connection.",
    generic: "An unexpected error occurred. Please try again.",
    required: "This field is required.",
    emailInvalid: enUi.email_invalid_error || "Please enter a valid email address.",
    otpInvalid: enUi.auth_notification_error || "Invalid verification code. Please try again.",
    otpIncomplete: "Please enter the full 4-digit code.",
    nameRequired: "Please enter a name to continue.",
    nameCooldown: "Display name can only be changed once every 14 days.",
    answersIncomplete: "Please answer all questions before proceeding.",
    notFoundTitle: "Page Not Found",
    notFoundDesc: "The page you are looking for does not exist or has been moved.",
    notFoundBackHome: "Back to Home"
  },

  legal: {
    chrome: {
      goBack: "Go Back",
      backHome: "Back to Home",
      lastUpdated: "Last updated: {date}"
    },
    terms: {
      title: "Terms & Conditions",
      lastUpdated: "September 4, 2026"
    },
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "September 4, 2026"
    },
    refund: {
      title: "Refund Policy",
      lastUpdated: "September 2026"
    }
  },

  accessibility: {
    closeDialog: "Close dialog",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    languageSelector: "Choose language",
    shareLink: "Share link",
    copyLink: "Copy link",
    emailInput: "Email address",
    nameInput: "Your name",
    verificationDigit: "Verification code digit {index}",
    avatarOption: "Avatar option {index}",
    toggleNotifications: "Toggle notifications",
    progressIndicator: "Step {current} of {total}",
    radarChart: "Perception radar chart",
    ratingScale: "Rating scale from strongly disagree to strongly agree",
    socialLink: "Social profile link"
  }
};

// Turkish namespaces: match all keys exactly with high-quality Turkish localization
const trNamespaces = {
  common: {
    next: trUi.next_btn || "İleri",
    back: trUi.back_btn || "Geri",
    submit: trUi.submit_btn || "Gönder",
    cancel: "Vazgeç",
    confirm: "Onayla",
    save: "Kaydet",
    close: "Kapat",
    copy: "Kopyala",
    copied: trUi.copied_alert || "Bağlantı kopyalandı!",
    delete: "Sil",
    edit: "Düzenle",
    share: "Paylaş",
    gotIt: "Anladım",
    loading: "Yükleniyor...",
    processing: "İşleniyor...",
    viewProfile: trUi.view_profile_btn || "Profili Gör",
    unknownPerson: trUi.unknown_person || "Bilinmeyen Kişi",
    accuracy: "İsabet",
    match: "Uyum",
    timeAgoSuffix: trUi.response_history?.time_ago_suffix || "önce",
    seconds: "saniye",
    minutes: "dakika",
    hours: "saat",
    days: "gün",
    oneTime: "Tek Seferlik",
    visits: "Ziyaret",
    agreement_strongly_disagree: trUi.agreement_strongly_disagree || "Kesinlikle Katılmıyorum",
    agreement_disagree: trUi.agreement_disagree || "Katılmıyorum",
    agreement_neutral: trUi.agreement_neutral || "Kararsızım",
    agreement_agree: trUi.agreement_agree || "Katılıyorum",
    agreement_strongly_agree: trUi.agreement_strongly_agree || "Kesinlikle Katılıyorum",
    signals: {
      samimiyet: trUi.label_samimiyet || "Samimiyet",
      cekicilik: trUi.label_cekicilik || "Çekicilik",
      zeka: trUi.label_zeka || "Zeka",
      vizyon: trUi.label_vizyon || "Vizyon",
      enerji: trUi.label_enerji || "Enerji",
      guvenilirlik: trUi.label_guvenilirlik || "Güvenilirlik",
      ego: trUi.label_ego || "Ego",
      basari: trUi.label_basari || "Başarı",
      comertlik: trUi.label_comertlik || "Cömertlik",
      olgunluk: trUi.label_olgunluk || "Olgunluk"
    },
    signalDescriptions: {
      samimiyet: trUi.desc_samimiyet || "",
      cekicilik: trUi.desc_cekicilik || "",
      zeka: trUi.desc_zeka || "",
      vizyon: trUi.desc_vizyon || "",
      enerji: trUi.desc_enerji || "",
      guvenilirlik: trUi.desc_guvenilirlik || "",
      ego: trUi.desc_ego || "",
      basari: trUi.desc_basari || "",
      comertlik: trUi.desc_comertlik || "",
      olgunluk: trUi.desc_olgunluk || ""
    },
    rarity: {
      common: "Yaygın",
      elite: "Seçkin",
      rare: "Nadir",
      unique: "Eşsiz"
    },
    strength_strong: trUi.strength_strong || "Belirgin Fark",
    strength_clear: trUi.strength_clear || "Net Fark",
    strength_subtle: trUi.strength_subtle || "Hafif Ayrışma",
    conf_forming: trUi.conf_forming || "Şekilleniyor",
    conf_outside_open: trUi.conf_outside_open || "Netleşiyor",
    conf_gap_open: trUi.conf_gap_open || "Açık",
    conf_stronger_signal: trUi.conf_stronger_signal || "Kristalize",
    confidence_band_label: trUi.confidence_band_label || "Sinyal Gücü",
    capacity_full_label: trUi.capacity_full_label || "Kota Dolu",
    full_signal_label: trUi.full_signal_label || "Tam Sinyal"
  },

  navigation: {
    dashboard: trUi.nav_dashboard || "Kontrol Paneli",
    settings: trUi.nav_settings || "Profil",
    packages: trUi.nav_packages || "10Signal Plus",
    start: trUi.nav_start || "Testi Başlat",
    login: trUi.nav_login || "Giriş Yap",
    logout: trUi.nav_logout || "Çıkış Yap",
    howItWorks: trUi.nav_how_it_works || "Nasıl Çalışır?",
    socialIdentities: trUi.nav_social_identities || "Sosyal Roller",
    plans: trUi.nav_plans || "Planlar",
    faq: trUi.nav_faq || "SSS",
    backHome: "Ana Sayfaya Dön",
    goBack: "Geri Dön",
    footer: {
      quickLinks: trUi.footer_quick_links || "Keşfet",
      support: trUi.footer_support || "Destek & Bilgi",
      privacy: trUi.footer_privacy || "Gizlilik Politikası",
      privacyPolicy: trUi.footer_privacy_policy || "Gizlilik Politikası",
      terms: trUi.footer_terms_of_use || "Kullanım Koşulları",
      contact: trUi.footer_contact || "İletişim",
      contactUs: trUi.footer_contact_us || "İletişim",
      description: trUi.landing_footer_desc || "10Signal, insanların kendilerini ve birbirlerini daha iyi anlamaları için özenle tasarlanmıştır.",
      rights: trUi.landing_footer_rights || "10Signal. Tüm hakları saklıdır.",
      slogan: trUi.landing_footer_slogan || "Kendini gör"
    }
  },

  home: {
    hero: {
      tag: trUi.landing_hero_tag || "Sosyal farkındalık deneyimi",
      title1: trUi.landing_hero_title_1 || "İnsanların seni nasıl ",
      titleItalic: trUi.landing_hero_title_italic || "deneyimlediğini",
      title2: trUi.landing_hero_title_2 || " keşfet.",
      desc: trUi.landing_hero_desc || "Kendini nasıl gördüğünü, seni tanıyan insanların deneyimiyle karşılaştır. 10Signal, öz-algın ile dış algın arasındaki ortak sinyalleri ve farkları görünür kılar.",
      ctaFree: trUi.landing_hero_cta_free || "Ücretsiz başla · İlk sonuçlarını dakikalar içinde gör",
      startCta: trUi.landing_start_cta || "10Signal'ını Başlat",
      quickLogin: trUi.landing_quick_login || "Giriş Yap",
      caption: trUi.landing_hero_caption || "Aynı masa, farklı bakışlar",
      badge: trUi.badge_text || "10 SOSYAL SİNYAL. GERÇEK YANITLAR.",
      anonymousNoSignup: trUi.anonymous_no_signup || "Anonim. Üyelik gerektirmez.",
      socialProof: trUi.social_proof_answers || "1.500+ kişi yanıtladı"
    },
    stats: {
      stat1Val: trUi.landing_stats_1_val || "1.2K+",
      stat1Lbl: trUi.landing_stats_1_lbl || "Oluşturulan Profil",
      stat2Val: trUi.landing_stats_2_val || "15K+",
      stat2Lbl: trUi.landing_stats_2_lbl || "Paylaşılan Yanıt",
      stat3Val: trUi.landing_stats_3_val || "240K+",
      stat3Lbl: trUi.landing_stats_3_lbl || "Toplam Algı Sinyali",
      stat4Val: trUi.landing_stats_4_val || "89.4%",
      stat4Lbl: trUi.landing_stats_4_lbl || "Analiz Tutarlılığı"
    },
    opening: {
      tag: trUi.landing_opening_tag || "Başlangıç",
      quote: trUi.landing_opening_quote || "Kendimizi bildiğimizi sanırız. Ama bizi tanıyanlar, göremediğimiz bir şeyi taşır: ",
      quoteItalic: trUi.landing_opening_quote_italic || "onların gözünden nasıl göründüğümüzü.",
      desc: trUi.landing_opening_desc || "10Signal bir test değil. Seni tanımlayıp kutulara koymaz. Kendi anlatını, çevrenin sessiz gözlemleriyle yan yana getirir ve aradaki o ince farkta kendini görmen için alan açar."
    },
    experience: {
      tag: trUi.landing_hiw_tag || "Deneyim",
      title: trUi.landing_hiw_title || "Üç perdede gerçekleşen bir okuma.",
      desc: trUi.landing_hiw_desc || "Önce sen kendi anlatını kurarsın. Sonra çevren sessizce katkıda bulunur. Son perdede ikisi birleşir.",
      m1Title: trUi.landing_hiw_m1_turkish || "Kendi Anlatın",
      m1Text: trUi.landing_hiw_m1_text || "Şu an kendi zihninde kendini nasıl gördüğünü paylaşırsın. Başlangıç noktan burası.",
      m2Title: trUi.landing_hiw_m2_turkish || "Dışarının Sesi",
      m2Text: trUi.landing_hiw_m2_text || "Bilenler anonim olarak katkıda bulunur. Tek tek cevaplar değil, tekrar eden ortak sinyaller önemlidir.",
      m3Title: trUi.landing_hiw_m3_turkish || "Aradaki Boşluk",
      m3Text: trUi.landing_hiw_m3_text || "Kendi anlatınla dış algı buluşur. Hangi noktalarda birleştiğini, nerede ayrıştığını görürsün."
    },
    contexts: {
      tag: trUi.landing_cases_tag || "Bağlamlar",
      title: trUi.landing_cases_title || "10Signal sadece bir test değildir.",
      desc: trUi.landing_cases_desc || "Hayatının farklı anlarında insanların seni nasıl deneyimlediğini keşfedebilirsin.",
      c1Plate: trUi.landing_case_1_plate || "Dijital Yansıma",
      c1Title: trUi.landing_case_1_title || "Sosyal profilinde",
      c1Text: trUi.landing_case_1_text || "Profiline 10Signal linkini ekle. Kendini nasıl sunduğun ile nasıl deneyimlendiğini keşfet.",
      c2Plate: trUi.landing_case_2_plate || "Sosyal Dinamik",
      c2Title: trUi.landing_case_2_title || "Arkadaş grubunda",
      c2Text: trUi.landing_case_2_text || "Yakın çevrenden geri bildirim al ve seni bağlayan ortak sinyalleri incele.",
      c3Plate: trUi.landing_case_3_plate || "İlk İzlenim",
      c3Title: trUi.landing_case_3_title || "Yeni tanışmalarda",
      c3Text: trUi.landing_case_3_text || "İlk izlenimler ile kendini nasıl gördüğün arasındaki ilişkiyi gözlemle."
    },
    howItWorks: {
      tag: trUi.landing_ex_tag || "NASIL ÇALIŞIR",
      title: trUi.landing_ex_title || "3 Adımda 10Signal",
      desc: trUi.landing_ex_desc || "Öz-algını ve dış gözlemleri 3 basit adımda bir araya getirin:",
      s1Title: trUi.landing_ex_b1_title || "01 / Kendini Tanımla",
      s1Text: trUi.landing_ex_b1_text || "Hızlı bir öz-değerlendirme ile anlatını oluştur ve dijital Self kartını al.",
      s2Title: trUi.landing_ex_b2_title || "02 / Linkini Paylaş",
      s2Text: trUi.landing_ex_b2_text || "Linkini sosyal medyada veya arkadaşlarınla paylaşarak anonim geri bildirim topla.",
      s3Title: trUi.landing_ex_b3_title || "03 / Canlı Sonuçları İzle",
      s3Text: trUi.landing_ex_b3_text || "Yanıtlar geldikçe nerede birleştiğini ve ayrıştığını gösteren canlı panelini takip et."
    },
    layers: {
      tag: trUi.landing_layers_tag || "Katmanlar",
      title: trUi.landing_layers_title || "Sonuçlar dört katmandan oluşur.",
      desc: trUi.landing_layers_desc || "Her katman 10Signal tarafından ölçülen açıklanabilir bir boyuta dayanır. Birlikte, kendini nasıl gördüğünü ve insanların seni nasıl deneyimlediğini anlatır.",
      l1Desc: trUi.landing_layers_l1_desc || "Şu anda kendini nasıl tanımladığını gösteren öz-algı katmanı.",
      l2Desc: trUi.landing_layers_l2_desc || "Seni tanıyan insanlardaki tekrar eden ortak sinyallerin bir özeti.",
      l3Desc: trUi.landing_layers_l3_desc || "Öz-algı ile dış algı arasındaki ortak ve ayrışan yönler.",
      l4Desc: trUi.landing_layers_l4_desc || "Bir arkadaşına katkıda bulunduğunda insanları nasıl okuduğunu yansıtır."
    },
    collection: {
      tag: trUi.landing_codes_tag || "Koleksiyon",
      cardHeader: trUi.landing_codes_card_header || "Sosyal Rol",
      title: trUi.landing_codes_title || "Her sonucun kendine ait bir dili var.",
      desc: trUi.landing_codes_desc || "10Signal sonuçları yalnızca bir tanım değil; paylaşılabilir bir kimlik ve keşfedilecek bir koleksiyon parçası sunar.",
      viewAll: trUi.landing_codes_view_all || "Tüm Sosyal Rolleri İncele"
    },
    security: {
      tag: trUi.landing_security_tag || "Güvenlik",
      title: trUi.landing_security_title || "Güvenli olmak üzere tasarlandı.",
      p1Title: trUi.landing_security_p1_title || "Tam Anonimlik",
      p1Text: trUi.landing_security_p1_text || "Katılımcı kimlikleri tamamen gizlidir, tek tek verilen cevaplar asla gösterilmez.",
      p2Title: trUi.landing_security_p2_title || "Ortak Sinyaller",
      p2Text: trUi.landing_security_p2_text || "Sonuçlar tek bir girişten değil, yalnızca tekrar eden ortak verilerden üretilir.",
      p3Title: trUi.landing_security_p3_title || "Korunan Veri",
      p3Text: trUi.landing_security_p3_text || "Algı verileriniz asla üçüncü taraflarla paylaşılmaz veya ticarileştirilmez."
    },
    finalCta: {
      title: trUi.landing_final_title || "Kendini nasıl gördüğün ile insanların seni nasıl deneyimlediğini karşılaştır.",
      desc: trUi.landing_final_desc || "10Signal deneyimine başla ve seni tanıyanların gördüğü ortak sinyalleri keşfet."
    }
  },

  auth: {
    modalNameTitle: trUi.modal_name_title || "10Signal'ını Oluştur",
    modalNameSubtitle: trUi.modal_name_subtitle || "Sana nasıl hitap edelim? Teste başlamak için bir isim gir.",
    modalNamePlaceholder: trUi.modal_name_placeholder || "görünen isim / ad",
    loginTitle: trUi.email_entry_quick_login_title || "Hızlı Giriş",
    newProfileTitle: trUi.email_entry_new_profile_title || "Yeni Profil",
    loginDesc: trUi.email_entry_quick_login_desc || "Profiline ve yansımalarına erişmek için kayıtlı e-posta adresini gir.",
    newProfileDesc: trUi.email_entry_new_profile_desc || "Sosyal ayna profilini oluşturmak ve başlamak için e-posta adresini gir.",
    emailPlaceholder: trUi.auth_mail_placeholder || "E-posta adresiniz",
    sendCodeBtn: trUi.auth_mail_btn || "Kod Gönder",
    otpTitle: trUi.auth_otp_title || "E-postayı Doğrula",
    otpDesc: trUi.auth_otp_desc || "{email} adresine gönderdiğimiz 4 haneli kodu girin.",
    otpPlaceholder: trUi.auth_otp_placeholder || "0 0 0 0",
    verifyBtn: trUi.auth_otp_btn || "Kimliğimi Göster",
    resendCountdown: trUi.auth_resend_countdown || "Tekrar kod gönderme süresi: {time}",
    resendBtn: trUi.auth_resend_btn || "Tekrar Kod Gönder",
    changeEmailBtn: trUi.auth_change_email || "E-posta Adresini Değiştir",
    codeSent: trUi.auth_notification_sent || "Doğrulama kodu e-postanıza gönderildi.",
    verificationSuccess: trUi.auth_notification_success || "Kimlik doğrulandı, analiziniz hazırlanıyor...",
    invalidCode: trUi.auth_notification_error || "Geçersiz kod. Lütfen tekrar deneyin.",
    accountNotFound: "Hesap Bulunamadı",
    accountExists: "Hesap Zaten Mevcut",
    claimTitle: trUi.auth_mail_title || "Son bir adım",
    claimDesc: trUi.auth_mail_desc || "Sosyal kimliğini mühürlemek, hesabını güvenceye almak ve özel paylaşım linkini oluşturmak için e-postanı gir.",
    contactChannel: "İLETİŞİM KANALINIZ",
    verificationCodeHeader: "DOĞRULAMA KODUNUZ",
    verificationDigit: "Doğrulama hanesi {index}",
    emailAddressLabel: "E-posta adresi"
  },

  quiz: {
    onboarding: {
      nameTitle: trUi.wizard_nickname_title || "Sana nasıl hitap edelim?",
      namePlaceholder: trUi.wizard_nickname_placeholder || "İsminiz",
      languageTitle: trUi.wizard_language_title || "Dilinizi seçin",
      infoTitle: trUi.wizard_info_title || "Başlamadan önce",
      infoBullet1: trUi.wizard_info_bullet1 || "Yaklaşık 60 saniye sürer",
      infoBullet2: trUi.wizard_info_bullet2 || "Doğru ya da yanlış cevap yoktur",
      infoBullet3: trUi.wizard_info_bullet3 || "Tüm sorular yanıtlanmalıdır",
      infoCta: trUi.wizard_info_cta || "Başlayalım",
      startTest: "Testi Başlat"
    },
    runner: {
      chooseAvatarTitle: "Avatarını Seç",
      chooseAvatarSubtitle: "Görsel varlığınızı temsil eden bir avatar seçin.",
      avatarWomen: "Kız (6)",
      avatarMen: "Erkek (6)",
      questionCounter: "Soru {current} / {total}",
      progressAria: "Test ilerlemesi: Soru {current} / {total}"
    },
    results: {
      resultTitle: trUi.result_title || "Öz Yansıman",
      kicker: trUi.test_result_kicker || "SENİN SONUCUN",
      signatureLabel: trUi.result_signature_label || "Sosyal İmza",
      strongestTrait: trUi.insight_strongest_label || "En Güçlü Yön",
      weakestTrait: trUi.insight_calmest_label || "Arka Plandaki Yön",
      motivation: trUi.insight_motivation_label || "Motivasyon",
      shareSuite: "PAYLAŞIM MERKEZİ",
      shareYourResult: "Sonucunu Paylaş",
      downloadStory: "Hikaye görseli indir ve paylaş",
      sendDirect: "Arkadaşlarına doğrudan mesaj gönder",
      copyLink: "Bağlantıyı Kopyala",
      copiedLink: "Bağlantı Kopyalandı!",
      copyProfileLink: "Profil linkini panoya kopyala",
      inviteFriendsTitle: trUi.invite_friends_title || "Dış Algını Açmak İçin Arkadaşlarını Davet Et",
      inviteFriendsDesc: trUi.invite_friends_desc || "Bu bağlantıyı arkadaşlarına gönder. 3 kişi yanıtladığında Dış Algın ve Fark Analizin açılacak.",
      copyFriendLink: trUi.copy_link_btn || "Arkadaş Linkini Kopyala",
      viewProfileBtn: trUi.view_profile_btn || "Profili Gör"
    },
    identities: {
      title: trUi.identities_title || "Sosyal Roller",
      subtitle: trUi.identities_subtitle || "10 sosyal sinyalin kombinasyonundan doğan 45 benzersiz sosyal imza. Kartları inceleyerek yansımanı ve geride bıraktığın izleri keşfet.",
      searchPlaceholder: trUi.identities_search_placeholder || "Rollerde ara...",
      filterAll: trUi.identities_filter_all || "Tümü",
      analysisTitle: trUi.identities_analysis_title || "Rol Analizi",
      ctaDiscover: trUi.identities_cta_discover || "Bu Rolü Kendinde Keşfet",
      descTemplate: trUi.identities_desc_template || "Sosyal algıda bu karakter {d1} Aynı zamanda bu profil {d2} Bu iki baskın özelliğin yarattığı sinerji, sizi sosyal çevrenizde ayırt edici ve saygı duyulan bir imza haline getirir. İnsanlar bu güçlü bileşimi hisseder ve yaydığınız çift yönlü derinliğe hayranlık duyar.",
      families: {
        stratega: trUi.family_stratega || "Stratega",
        imperia: trUi.family_imperia || "Imperia",
        aura: trUi.family_aura || "Aura",
        porta: trUi.family_porta || "Porta",
        gratia: trUi.family_gratia || "Gratia"
      }
    }
  },

  participant: {
    intro: {
      title: trUi.friend_intro_title || "Arkadaşını Oku",
      desc: trUi.friend_intro_desc || "Yüzeysel sosyal etkileşimlerin ötesine geç. Arkadaşının sosyal enerjisini, duruşunu ve sınırlarını değerlendir. Bu test anonimdir; verdiğin bireysel yanıtlar asla doğrudan paylaşılmaz.",
      question: "İnsanların gözünde nasıl biri?",
      nicknameLabel: trUi.friend_nickname_label || "Bir takma ad gir (İsteğe bağlı)",
      startBtn: trUi.friend_start_btn || "Değerlendirmeye Başla",
      evaluatedTitle: "Değerlendirme Tamamlandı",
      evaluatedDesc: "Bu kişi için perspektifinizi başarıyla paylaştınız. Katkınız için teşekkür ederiz.",
      cappedTitle: "Katılımcı Kotası Dolu",
      cappedDesc: "{name} adlı kullanıcının profili maksimum katılımcı limitine ulaşmıştır.",
      responseCount_one: "{count} Yanıt",
      responseCount_other: "{count} Yanıt"
    },
    quiz: {
      quizTitle: trUi.friend_quiz_title || "Arkadaş Değerlendirme Testi",
      privacyNote: trUi.privacy_note || "Kimse ifşa edilmez. Bireysel yanıtlar asla gösterilmez."
    },
    result: {
      resultTitle: trUi.friend_result_title || "Yansıma Tamamlandı",
      completedTitle: "Algı Analizini Tamamladınız!",
      completedDesc: "Arkadaşınızı kendi gözünüzden yansıttınız. Verdiğiniz cevaplar ve sosyal sinyaller doğrultusunda 10Signal analitik motoru okuma tarzınızı hesapladı.",
      readingStyleLabel: trUi.friend_style_label || "Sosyal Okuma Tarzınız",
      accuracyScore: trUi.friend_accuracy_score || "Algı İsabeti",
      accuracyDesc: trUi.friend_accuracy_desc || "Kendilerini nasıl gördükleri ile sizin onları nasıl okuduğunuz arasındaki eşleşme oranı.",
      accuracyWord: "İSABET",
      shareWhatsApp: "WhatsApp Paylaş",
      saveStory: "Kaydet / Hikaye Oluştur",
      startOwnTitle: trUi.friend_cta_title || "Senin sosyal imzan ne?",
      startOwnDesc: trUi.friend_cta_desc || "Kendi testini başlat, kendini nasıl gördüğünle arkadaşlarının seni nasıl okuduğunu karşılaştır.",
      startOwnBtn: trUi.friend_create_own_btn || "Kendi 10Signal'ını Oluştur",
      goToDashboardTitle: trUi.friend_cta_title_loggedin || "Başkalarının seni nasıl okuduğunu gör",
      goToDashboardDesc: trUi.friend_cta_desc_loggedin || "Bir arkadaşını değerlendirdin. Şimdi profiline dönerek diğerlerinin seni nasıl okuduğunu keşfet.",
      goToDashboardBtn: trUi.friend_goto_dashboard_btn || "Profilime Git"
    },
    share: {
      whatsAppText: "Bilinçaltı Arşivi'nden bir kesit: Çevrimin gözünden algılanan auram '{cardName}' olarak şekillendi. Peki senin dünyanda benim yansımam ne? Aynanın arkasını gör: {url}",
      storyReadyTitle: "Story Hazır!",
      storyReadyDesc: "Story görselin indirildi. Tıklanabilir link eklemek için:",
      step1: "1. Instagram'ı aç, yeni Story oluştur",
      step2: "2. İndirilen görseli arka plan yap",
      step3: "3. Çıkartma simgesine dokun → \"Bağlantı\"",
      step4: "4. 10Signal linkini yapıştır",
      storyCopyLink: "Kopyala",
      storyCopied: "Kopyalandı ✓",
      storyGotIt: "Anladım",
      storyTagline: "BİLİNÇALTI ARŞİVİ",
      storyQuote: "\"Senin dünyanda benim yansımam hangisi?\""
    }
  },

  dashboard: {
    title: trUi.dashboard_title || "Sosyal Yansıman",
    signalsFormingTitle: trUi.signals_forming_title || "Sinyaller Oluşuyor",
    signalsFormingDesc: trUi.signals_forming_desc || "Profilin yayında. Arkadaşlarından okuma almak için linkini paylaş. 3 yanıtta Dış Algın ve Fark Analizin açılır.",
    lockedSectionTitle: trUi.locked_section_title || "Gözlem Bekleniyor",
    lockedSectionOutsideDesc: trUi.locked_section_outside_desc || "Dış Algı analizini açmak için en az 3 arkadaş yanıtı gereklidir.",
    lockedSectionGapDesc: trUi.locked_section_gap_desc || "Öz-algı ile dış algı arasındaki fark analizini (The Gap) açmak için 3 arkadaş yanıtı gereklidir.",
    inspectProfile: trUi.inspect_profile || "Profili İncele",
    tabs: {
      self: trUi.self_view_title || "Öz Algı",
      outside: trUi.outside_view_title || "Dış Algı",
      gap: trUi.gap_analysis_title || "Fark Analizi",
      responses: trUi.response_history?.menu_title || "Gelen Analizler",
      decisionTimes: trUi.rhythmic_analysis?.menu_title || "Düşünce Akışı"
    },
    self: {
      title: trUi.self_view_title || "Öz Algı",
      viewDetailed: "Detaylı Analizi Gör"
    },
    outside: {
      title: trUi.outside_view_title || "Dış Algı",
      totalObservations: trUi.responses_received || "Toplam Gözlem",
      viewDetailed: "Detaylı Analizi Gör"
    },
    gap: {
      title: trUi.gap_analysis_title || "Algı Farkı Analizi (The Gap)",
      strengthLabel: trUi.gap_strength_label || "Fark Şiddeti",
      blindSpotTitle: trUi.gap_blind_spot_title || "Kör Nokta",
      blindSpotDesc: trUi.gap_blind_spot_desc || "Çevreniz, {category} özelliğinizi kendinizi değerlendirdiğinizden belirgin derecede daha yüksek algılıyor. Bu yönünüz dışarıya fark ettiğinizden daha güçlü yansıyor.",
      illusionTitle: trUi.gap_illusion_title || "Sosyal Maske",
      illusionDesc: trUi.gap_illusion_desc || "İç dünyanızda {category} özelliğini güçlü hissetseniz de, dışarıya daha sakin yansıtıyorsunuz. Bu potansiyeliniz çevreniz tarafından tam olarak görünmüyor olabilir.",
      alignmentTitle: trUi.gap_alignment_title || "Tam Uyum",
      alignmentDesc: trUi.gap_alignment_desc || "{category}, öz-algınız ile dış gözlemlerin birbirine en yakın olduğu alandır. Bu boyutta dengeli, sahici ve doğal bir duruş sergiliyorsunuz.",
      legendSelf: trUi.gap_legend_self || "Kendisi",
      legendFriend: trUi.gap_legend_friend || "Çevre",
      tooltipSelf: trUi.gap_tooltip_self || "Kendisi: %{value}",
      tooltipFriend: trUi.gap_tooltip_friend || "Çevre: %{value}",
      comparisonTitle: "Algı Karşılaştırması",
      howYouSeeYourself: "Kendini Nasıl Görüyorsun",
      howFriendsSeeYou: "İnsanlar Seni Nasıl Görüyor",
      gapBadge: "FARK",
      insightTitle: "Fark Analizi Rehberi",
      insightDesc: "Bu fark, kendi içsel algınız ile dış dünyaya yaydığınız sosyal sinyaller arasındaki eşsiz kesişimi temsil eder. Bir uyumsuzluk olmanın ötesinde, başkalarında bıraktığınız saklı ve özgün etkinin bir göstergesidir.",
      editorialSelfLow: trUi.gap_editorial_self_low || "minimal ve sakin",
      editorialSelfMedium: trUi.gap_editorial_self_medium || "dengeli ve ılımlı",
      editorialSelfHigh: trUi.gap_editorial_self_high || "baskın ve yoğun",
      editorialFriendLow: trUi.gap_editorial_friend_low || "sakin",
      editorialFriendMedium: trUi.gap_editorial_friend_medium || "dengeli ve belirgin",
      editorialFriendHigh: trUi.gap_editorial_friend_high || "zirvede ve yoğun",
      illusionSelfLow: trUi.gap_illusion_self_low || "sakin",
      illusionSelfMedium: trUi.gap_illusion_self_medium || "dengeli ve belirgin",
      illusionSelfHigh: trUi.gap_illusion_self_high || "baskın ve zirvede",
      illusionFriendLow: trUi.gap_illusion_friend_low || "minimal ve hafif",
      illusionFriendMedium: trUi.gap_illusion_friend_medium || "dengeli ve ılımlı",
      illusionFriendHigh: trUi.gap_illusion_friend_high || "yoğun ve belirgin",
      alignLevelLow: trUi.gap_align_level_low || "sakin ve hafif",
      alignLevelMedium: trUi.gap_align_level_medium || "dengeli ve ılımlı",
      alignLevelHigh: trUi.gap_align_level_high || "zirvede ve oldukça yoğun",
      contrastBlindSpotHigh: trUi.gap_contrast_blind_spot_high || "beklentinizin çok ötesinde dışarıya yansıyor",
      contrastBlindSpotLow: trUi.gap_contrast_blind_spot_low || "öz-algınıza göre daha belirgin bir duruşla öne çıkıyor",
      contrastIllusionHigh: trUi.gap_contrast_illusion_high || "zengin iç dünyanıza kıyasla dışarıya çok daha sakin bir varlık yansıtıyor",
      contrastIllusionLow: trUi.gap_contrast_illusion_low || "dış dünyaya biraz daha dengeli ve sakin bir tonda yansıtıyor",
      matchAlignment: trUi.gap_match_alignment || "birebir örtüşüyor"
    },
    decisionTimes: {
      lockedTitle: "Düşünce Ritimleri Kilitli",
      lockedDesc: "Arkadaşlarınızın en çok hangi sorularda duraksadığını, profil ziyaretlerini ve karar sürelerini 10Signal Plus ile keşfedin.",
      unlockPlus: "Plus ile Kilidi Aç",
      profileVisitsTitle: "Gizli İncelemeler & Ziyaretçi Dağılımı",
      profileVisitsDesc: "Linkinizi açan kişilerdeki yanıtlama oranını ve bıraktığınız ilk izlenimi analiz eder.",
      visits: "Ziyaret",
      conversion: "Tamamlama Oranı",
      longestHesitation: "BİLİŞSEL DURAKSAMA",
      instantConviction: "REFLEKS KARAR",
      lockedSignal: "Kilitli Sinyal",
      averagePause: "ortalama düşünme süresi",
      rhythmicAnalysisTitle: trUi.rhythmic_analysis?.menu_title || "Düşünce Akışı",
      hesitatingTitle: trUi.rhythmic_analysis?.hesitating_title || "Gizem Eşiği",
      hesitatingDesc: trUi.rhythmic_analysis?.hesitating_desc || "İnsanlar sizinle ilgili bu analizi yanıtlarken, en çok {signal} odaklı sorularda duraksadı. Bu durum, bu yönünüzün dış dünyaya tekdüze ve basit bir çizgide yansımadığını gösterir. Karakterinizin bu boyutu, çevrenizde derin bir merak uyandırıyor ve karar vermeden önce en çok düşündükleri alan oluyor.",
      confidentTitle: trUi.rhythmic_analysis?.confident_title || "Doğal Yansıma",
      confidentDesc: trUi.rhythmic_analysis?.confident_desc || "Arkadaşlarınız, {signal} hakkındaki soruları milisaniyeler içinde tek bir an bile tereddüt etmeden geçti. Bu alandaki auranız dış dünyada öylesine net ve tartışmasız ki, çevreniz ikinci bir düşünceye ihtiyaç duymadan bu gücünüzü anında onayladı."
    },
    responses: {
      tabTitle: trUi.response_history?.menu_title || "Gelen Analizler",
      tabDesc: trUi.response_history?.tab_desc || "Arkadaşlarınızın bıraktığı anonim bireysel analizlerin kronolojik akışı.",
      empty: "Henüz yanıt yok. İlk sinyallerini almak için profil linkini paylaş.",
      lockDesc: trUi.response_history?.lock_desc || "Bu yanıt detayını, sinyal puanlarını ve zamanlama analizini görmek için Plus'a yükseltin.",
      lockWarning: trUi.response_history?.lock_warning || "Gizlilik Güvencesi: Bu analizi açsanız bile oy veren kişinin kimliği gizli kalır. Tüm yansımalar tamamen anonimdir.",
      drawerClose: "Pencereyi kapat",
      individualAnalysis: "BİREYSEL ANALİZ",
      individualReflectionDetail: "BİREYSEL YANSIMA DETAYI",
      matchRate: "%{accuracy} Uyum",
      answersAcrossQuestions: "10 sorunun tamamında verdiği bireysel yanıtlar",
      decisionDurations: "Sorulardaki düşünme ve karar süreleri",
      archetypeDeviations: "Sosyal sinyal ve karakter algı sapmaları",
      unlockDetailsWithPlus: "Plus ile Detayları Aç",
      signalsDistributionTitle: "10 Sosyal Sinyal Dağılımı",
      signalsDistributionDesc: "Bu kişinin verdiği yanıtlara göre profilinizdeki sinyal skorları:",
      cognitiveRhythmTitle: "Bilişsel Karar Ritmi",
      cognitiveRhythmDesc: "Sorularda nerede en çok, nerede en az düşündü?",
      longestPause: "En Çok Düşündüğü",
      fastestAnswer: "En Az Düşündüğü"
    },
    qr: {
      modalTitle: "Okumak İçin Tara",
      modalDesc: "İnsanların telefonlarından doğrudan testinizi yanıtlaması için bu karekodu okutun.",
      copyLink: "Linki Kopyala",
      copied: "Kopyalandı!",
      close: "Kapat"
    }
  },

  settings: {
    profile: {
      tabTitle: "Profil Ayarları",
      avatarTitle: "Profil Avatarı",
      avatarSaved: "Kaydedildi",
      avatarSaving: "Kaydediliyor...",
      avatarSubtitle: "Görsel varlığınızı temsil eden bir avatar seçin.",
      changeAvatar: "Avatarı Değiştir",
      closeAvatar: "Kapat",
      womenCategory: "Kız (6)",
      menCategory: "Erkek (6)",
      displayNameTitle: "Görünen İsim",
      displayNameDesc: "Paylaşım davetlerinde ve kartlarda görünen adınız.",
      saveName: "Kaydet",
      emailTitle: "Hesap E-postası",
      emailDesc: "Güvenli giriş ve hesap kurtarma için kullanılır.",
      changeEmail: "E-postayı Değiştir",
      nameCooldownNote: "Görünen adınızı değiştirdikten sonra tekrar değiştirmek için 14 gün beklemeniz gerekir."
    },
    security: {
      tabTitle: "Bildirimler & Güvenlik",
      emailNotifsTitle: "E-posta Bildirimleri",
      emailNotifsDesc: "E-posta adresinize hangi bildirimlerin geleceğini yönetin.",
      turnOff: "Bildirimleri Kapat",
      turnOn: "Bildirimleri Aç",
      newEvaluationsTitle: "Yeni Değerlendirmeler",
      newEvaluationsDesc: "Biri değerlendirme testinizi tamamladığında anlık bildirim alın.",
      reportMilestonesTitle: "Rapor & Kilit Bildirimleri",
      reportMilestonesDesc: "3, 5, 10 yanıta ulaştığınızda ve kilitler açıldığında bildirim alın.",
      weeklyDigestTitle: "Haftalık Özet",
      weeklyDigestDesc: "Profil trafiğinizin ve son izlenimlerinizin haftalık özeti.",
      productUpdatesTitle: "Pazarlama & Güncellemeler",
      productUpdatesDesc: "Yeni özellikler, sosyal roller ve platform duyuruları."
    },
    subscription: {
      tabTitle: "Planlar & Kota",
      quotaTitle: "Katılımcı Kotanız",
      quotaDesc: "Arkadaşlarınızdan toplayabileceğiniz yanıt sayısı.",
      responsesCollected: "Yanıt Toplandı",
      plusActiveTitle: "10Signal Plus Aktif",
      plusActiveDesc: "Bu profil için tüm gelişmiş özellikler ve sınırsız katılımcı kotası aktiftir.",
      viewBenefits: "Avantajları Gör",
      hideBenefits: "Avantajları Gizle",
      unlimitedCapacity: "Sınırsız Katılımcı Kotası",
      unlimitedCapacityDesc: "100 yanıt limitine takılmadan sınırsız yanıt toplayın",
      individualBreakdowns: "Gelen Analiz Detayları",
      individualBreakdownsDesc: "Arkadaşlarınızın 10 karakter sinyalini ve puan dökümünü görün",
      decisionTimes: "Soruda Geçirilen Zaman",
      decisionTimesDesc: "En çok ve en az düşünülen sorular",
      profileVisits: "Profil Ziyaretleri",
      profileVisitsDesc: "Ziyaretçi sayısını ve yanıta dönüşüm oranlarını anlık takip edin",
      upgradePlusTitle: "10Signal Plus'a Yükselt",
      upgradePlusDesc: "Tüm derin analizleri, bireysel yanıt detaylarını ve sınırsız katılımcı kotasını açın.",
      securePayment: "256-Bit SSL Güvenli Ödeme",
      upgradeBtn: "Plus’a Yükselt ({price})",
      expandCapacityTitle: "Yalnızca Yanıt Kotasını Artır",
      expandCapacityDesc: "Daha fazla geri bildirim toplamak için ek katılımcı paketleri ekleyin.",
      quotaText: "Yanıt",
      addPackBtn: "Paketi Ekle",
      addingPack: "Ekleniyor...",
      processing: "İşleniyor..."
    },
    deleteAccount: {
      deleteAccountBtn: trUi.delete_account || "Hesabı Sil",
      confirmDialog: "Hesabınızı ve hesabınıza bağlı tüm analiz verilerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      successAlert: "Hesabınız başarıyla silindi."
    },
    modal: {
      close: "Pencereyi kapat",
      verifyEmailTitle: "E-posta adresini doğrula",
      confirmNameTitle: "İsim değişikliğini onayla",
      verifyEmailDesc: "{email} adresine gönderilen 4 haneli kodu girin.",
      confirmNameDesc: "Görünen isminizi değiştirdikten sonra 14 gün boyunca tekrar değiştiremezsiniz. Devam etmek istediğinizden emin misiniz?",
      otpDigitAria: "Doğrulama kodu {index}. hane",
      verifyAndUpdate: "Doğrula ve Güncelle",
      confirmAndUpdate: "Onayla ve Güncelle",
      cancel: "Vazgeç",
      incompleteOtpError: "Lütfen 4 haneli kodu eksiksiz girin.",
      verifyFailedError: "İşlem doğrulanamadı.",
      paymentUnavailable: "Ödeme şu anda kullanılamıyor."
    }
  },

  billing: {
    sectionTitleHtml: trUi.pricing_section_title_html || "Daha derine inin:<br>Full 10Signal",
    plansSubtitle: trUi.plans_subtitle || "Karakterinizi, ilişkilerinizi ve sosyal auranızı daha derinlemesine keşfetmek için en uygun planı seçin.",
    badgePopular: trUi.pricing_badge_popular || "EN ÇOK TERCİH EDİLEN",
    disclaimer1: trUi.pricing_disclaimer_1 || "Ödeme sistemi henüz aktif değildir. Herhangi bir ödeme alınmayacaktır.",
    disclaimer2: trUi.pricing_disclaimer_2 || "Anonimlik korunur. Sahte yanıtlara izin verilmez.",
    getStarted: trUi.pricing_btn_get_started || "Başla",
    choosePlan: trUi.pricing_btn_choose_plan || "Planı Seç",
    free: {
      name: trUi.pricing_plan_free_name || "Yakın Çevre",
      price: trUi.pricing_plan_free_price || "Ücretsiz",
      f1: trUi.pricing_plan_free_f1 || "10 Sosyal Sinyal",
      f2: trUi.pricing_plan_free_f2 || "10 yanıta kadar",
      f3: trUi.pricing_plan_free_f3 || "İlk sinyaller 3 yanıtta",
      f4: trUi.pricing_plan_free_f4 || "Dış Algı hazır",
      f5: trUi.pricing_plan_free_f5 || "Paylaşılabilir bağlantı",
      f6: trUi.pricing_plan_free_f6 || "Üyelik gerekmez"
    },
    premium: {
      name: trUi.pricing_plan_premium_name || "Full 10Signal",
      price: trUi.pricing_plan_premium_price || "$2.99",
      f1: trUi.pricing_plan_premium_f1 || "Ücretsizdeki her şey",
      f2: trUi.pricing_plan_premium_f2 || "Derin Fark görünümü",
      f3: trUi.pricing_plan_premium_f3 || "Gizli Sinyal",
      f4: trUi.pricing_plan_premium_f4 || "Sosyal Çekim",
      f5: trUi.pricing_plan_premium_f5 || "Mors Raporu",
      f6: trUi.pricing_plan_premium_f6 || "10 Sinyal Dağılımı",
      f7: trUi.pricing_plan_premium_f7 || "Premium Paylaşım Paketi"
    },
    pro: {
      name: trUi.pricing_plan_pro_name || "Story Rush",
      price: trUi.pricing_plan_pro_price || "$14.99",
      f1: trUi.pricing_plan_pro_f1 || "Full plandaki her şey",
      f2: trUi.pricing_plan_pro_f2 || "Öncelikli sıralama",
      f3: trUi.pricing_plan_pro_f3 || "Hızlı hikaye teslimi",
      f4: trUi.pricing_plan_pro_f4 || "9 özel premium kart",
      f5: trUi.pricing_plan_pro_f5 || "Dışa aktarma stilleri"
    }
  },

  errors: {
    status_401: "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.",
    status_403: "Erişim reddedildi veya doğrulama gerekiyor.",
    status_404: "Aranan sayfa veya içerik bulunamadı.",
    status_409: "Bu bilgilerle kayıtlı bir hesap zaten mevcut.",
    status_429: "Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.",
    status_500: "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.",
    status_503: "Servis geçici olarak kullanılamıyor. Lütfen kısa süre sonra tekrar deneyin.",
    network: "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.",
    generic: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
    required: "Bu alan zorunludur.",
    emailInvalid: trUi.email_invalid_error || "Lütfen geçerli bir e-posta adresi girin.",
    otpInvalid: trUi.auth_notification_error || "Geçersiz doğrulama kodu. Lütfen tekrar deneyin.",
    otpIncomplete: "Lütfen 4 haneli kodu eksiksiz girin.",
    nameRequired: "Devam etmek için lütfen bir isim girin.",
    nameCooldown: "Görünen ad 14 günde bir değiştirilebilir.",
    answersIncomplete: "Lütfen devam etmeden önce tüm soruları yanıtlayın.",
    notFoundTitle: "Sayfa bulunamadı",
    notFoundDesc: "Aradığınız sayfa mevcut değil veya taşınmış olabilir.",
    notFoundBackHome: "Ana sayfaya dön"
  },

  legal: {
    chrome: {
      goBack: "Geri Dön",
      backHome: "Ana Sayfaya Dön",
      lastUpdated: "Son güncelleme: {date}"
    },
    terms: {
      title: "Kullanım Koşulları",
      lastUpdated: "4 Eylül 2026"
    },
    privacy: {
      title: "Gizlilik Politikası",
      lastUpdated: "4 Eylül 2026"
    },
    refund: {
      title: "İade Politikası",
      lastUpdated: "Eylül 2026"
    }
  },

  accessibility: {
    closeDialog: "Pencereyi kapat",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    languageSelector: "Dil seçin",
    shareLink: "Bağlantıyı paylaş",
    copyLink: "Bağlantıyı kopyala",
    emailInput: "E-posta adresi",
    nameInput: "İsminiz",
    verificationDigit: "Doğrulama kodu {index}. hane",
    avatarOption: "Avatar seçeneği {index}",
    toggleNotifications: "Bildirimleri aç/kapat",
    progressIndicator: "{total} adımın {current}. adımı",
    radarChart: "Algı radar grafiği",
    ratingScale: "Kesinlikle katılmıyorum ile kesinlikle katılıyorum arası değerlendirme ölçeği",
    socialLink: "Sosyal profil bağlantısı"
  }
};

// Write files for EN and TR
for (const [ns, content] of Object.entries(enNamespaces)) {
  fs.writeFileSync(path.join(enDir, `${ns}.json`), JSON.stringify(content, null, 2), 'utf8');
}

for (const [ns, content] of Object.entries(trNamespaces)) {
  fs.writeFileSync(path.join(trDir, `${ns}.json`), JSON.stringify(content, null, 2), 'utf8');
}

console.log('Successfully generated all 12 namespace JSON files for EN and TR.');
