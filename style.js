module.exports.style = {


  '.pr-window': {
    width: Ti.UI.FILL,
    translucent: false,
    fullscreen: true,
    backgroundColor: '#ffffff',
    orientationModes: [
      Ti.UI.PORTRAIT
    ]
  },

  '.pr-toolbarbtn-menu': {
    borderColor: '#C65D58',
    borderWidth: '1dp',
    borderRadius: '4dp',
    backgroundImage: '/themes/roller/images/buttons/menu.png',
    backgroundLeftCap: '0dp',
    backgroundTopCap: 0,
    width: '36dp',
    height: '30dp'
  },

  '.pr-toolbarbtn-back': {
    borderColor: '#C65D58',
    title: L('Back'),
    font: {
      fontSize: '9dp',
      fontFamily: 'DroidSans',
      fontWeight: 'bold'
    }
  },


  '.pr-label': {
    color: '#000000',
    width: Ti.UI.FILL,
    textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
    font: {
      fontSize: '16dp',
      fontFamily: 'DroidSans'
    }
  },

  '.pr-label-bold': {
    width: Ti.UI.FILL,
    textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
    font: {
      fontSize: '16dp',
      fontFamily: 'DroidSans-Bold',
      fontWeight: 'bold'
    }
  },

  '.pr-container': {
    width: Ti.UI.FILL,
    height: Ti.UI.FILL,
    layout: 'vertical'
  },

  '.pr-header': {
    height: '50dp',
    '.pr-header-label': {
      textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
      verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP,
      shadowOffset: {x: 1, y: 1},
      font: {
        fontFamily: 'Droid Sans',
        fontSize: '20dp',
        fontWeight: 'bold'
      }
    }
  },

  '.pr-separator': {
    width: Ti.UI.FILL,
    height: '1dp',
    backgroundColor: '#000000'
  },

  '.pr-button': {

    height: '46dp',
    font: {
      fontSize: '18dp',
      fontFamily: 'DroidSans'
    }

  },

  '.pr-button-secondary': {

    height: '46dp',
    font: {
      fontSize: '16dp',
      fontFamily: 'DroidSans'
    },

  },

  /*
    !RESTAURANT BOOKING
  */
  '.pr-container-restaurantBooking': {
    top: '10dp',
    left: '20dp',
    right: '20dp',
    ipad: {
      top: '20dp',
      left: '25%',
      right: '25%'
    },

    '.pr-space-top': {
      top: '10dp'
    }
  },

  '.pr-restaurantbooking-buttons': {
    layout: 'vertical',
    width: Ti.UI.FILL,
    height: Ti.UI.SIZE,
    top: '10dp',

    '.pr-button': {
      width: Ti.UI.FILL
    }
  },

  '.pr-restaurantbooking-or': {
    width: Ti.UI.FILL,
    textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
  },


  /*
    !REVIEWS
  */

  '.pr-window-reviews': {

    layout: 'vertical'

  },

  /*
    !PRIVACY
  */
  '.pr-window-privacy': {

    layout: 'vertical',

    '.pr-container': {
      width: Ti.UI.FILL,
      height: Ti.UI.SIZE,
      left: '10dp',
      right: '10dp',
    },

    '.pr-label-content': {
      width: '100%',
      height: Ti.UI.SIZE,
      font: {
        fontSize: '16dp',
        fontFamily: 'DroidSans'
      }
    },

    'scrollView': {
      top: '10dp',
      height: Ti.UI.FILL,
      showVerticalScrollIndicator: true,
      horizontalBounce: false
    },

    '.pr-toolbar': {
      height: '60dp',
      '.pr-button-accept': {
        right: '5dp',
        top: '5dp',
        width: '160dp',
        font: {
          fontSize: '16dp',
          fontFamily: 'DroidSans'
        }

      },
      '.pr-button-cancel': {
        left: '5dp',
        top: '5dp'
      }

    }

  },


  /*
    !LOGIN
  */

  '.pr-login-socialbuttons': {
    top: '20dp',
    width: Ti.UI.FILL,
    height: '70dp',
    layout: 'horizontal',

    '.pr-login-socialbutton': {
      width: '70dp',
      height: '70dp'
    },

    '.pr-login-facebook': {
      image: '/assets/buttons/login_facebook.png'
    },

    '.pr-login-twitter': {
      image: '/assets/buttons/login_twitter.png'
    },

    '.pr-login-linkedin': {
      image: '/assets/buttons/login_linkedin.png'
    }

  },

  '.pr-welcome-login': {
    layout: 'horizontal',
    top: '20dp',
    height: Ti.UI.SIZE
  },

  '.pr-push-panel-login': {

    top: '20dp',
    height: '100dp',
    layout: 'horizontal',

    'switch': {
      left: '0dp'
    },

    'label': {
      left: '10dp',
      height: Ti.UI.FILL,
      verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
    }
  },

  '.pr-button-login': {
    top: '20dp',
    width: '100%'
  },

  '.pr-button-signup': {
    top: '20dp',
    width: '100%'
  },

  '.pr-button-logout': {
    top: '20dp',
    width: '100%'
  },

  '.pr-form-login': {
    top: '10dp',
    left: '40dp',
    right: '40dp',
    ipad: {
      top: '20dp',
      left: '25%',
      right: '25%'
    }
  },

  '.pr-form-logout': {

    top: '10dp',
    left: '40dp',
    right: '40dp',

    ipad: {
      top: '20dp',
      left: '25%',
      right: '25%'
    }

  },


  /*
    !IMAGEWALL
  */
  '.pr-imagewall': {

    layout: 'horizontal',
    left: '0dp',
    right: '8dp',
    top: '8dp',

    'imageView': {
      width: '70dp',
      height: '70dp',
      left: '8dp',
      top: '8dp'
    }

  },

  /*
    !IMAGE OVERLAY
  */

  '.pr-overlay-gallery': {

    backgroundColor: '#000000',
    width: Ti.UI.FILL,
    height: Ti.UI.FILL,
    opacity: 1,

    '.pr-btn-gallery': {
      borderRadius: '3dp',
      borderColor: '#eeeeee',
      backgroundColor: '#000000',
      width: '90dp',
      color: '#ffffff',
      font: {
        fontFamily: 'Droid Sans',
        fontSize: '12dp',

      }

    },

    '.pr-btn-close-gallery': {
      top: '10dp',
      right: '10dp',
      zIndex: 100
    },

    '.pr-btn-share-gallery': {
      top: '10dp',
      left: '10dp',
      zIndex: 100
    },

    '.pr-image-gallery': {
      width: Ti.UI.FILL,
      height: Ti.UI.SIZE,
      zIndex: 10
    },

    '.pr-footer': {
      width: Ti.UI.FILL,
      height: '34dp',
      let: '0dp',
      bottom: '0dp',
      zIndex: 100,


      '.pr-background': {
        width: Ti.UI.FILL,
        height: Ti.UI.FILL,
        backgroundColor: '#000000',
        opacity: 0.7,
        zIndex: 110
      },

      '.pr-label-title': {
        zIndex: 120,
        color: '#ffffff',
        opacity: 1,
        left: '10dp',
        font: {
          fontSize: '16',
          fontFamily: 'DroidSans'
        }
      }
    }


  },



  /*
    POSTS
  */

  '.pr-list-posts': {
    backgroundRepeat: true,
    width: Ti.UI.FILL,
    height: Ti.UI.FILL,

    '.pr-list-row-posts': {
      height: '75dp',
      ipad: {
        height: '150dp'
      }
    },

    '.pr-list-row-container-posts': {
      layout: 'horizontal',
      //backgroundColor: '#fcf3e2',
      height: '75dp',
      ipad: {
        height: '150dp'
      },

      '.pr-list-photo-posts': {
        width: '75dp',
        height: '75dp',
        ipad: {
          width: '150dp',
          height: '150dp'
        }
      }
    },

    '.pr-list-label-container-posts': {
      left: '5dp',
      right: '0dp',
      layout: 'vertical',
      width: Ti.UI.FILL,
      height: '75dp',

      ipad: {
        height: '150dp',
        left: '10dp',
      }
    },

    '.pr-list-label-posts': {
      textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
      verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP,
      right: '0dp',
      left: '0dp',
      top: '3dp',
      //color: '#5a3f2f',
      height: '19dp',
      //shadowColor: '#ffffff',
      shadowOffset: {x: 1, y: 1},
      font: {
        fontFamily: 'Droid Sans',
        fontSize: '16dp',
        fontWeight: 'bold'
      },
      ipad: {
        font: {
          fontFamily: 'Droid Sans',
          fontSize: '22dp',
          fontWeight: 'bold'
        },
        height: '23dp'
      }
    },

    '.pr-list-description-posts': {
      textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
      verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP,
      left: '0dp',
      right: '0dp',
      ellipsize: true,
      height: Ti.UI.FILL,
      //color: '#555555',
      font: {
        fontFamily: 'Droid Sans',
        fontSize: '14dp'
      },
      ipad: {
        font: {
          fontFamily: 'Droid Sans',
          fontSize: '20dp'
        }
      }
    }

  },

  /*
    !LEGEND
    A top header displaying some information, used in map
  */

  '.pr-legend': {

    width: Ti.UI.FILL,
    height: Ti.UI.SIZE,
    layout: 'absolute',

    '.pr-legend-inner': {

      left: '5dp',
      right: '5dp',
      top: '5dp',
      bottom: '5dp',
      layout: 'vertical',
      width: Ti.UI.FILL,
      height: Ti.UI.SIZE,

    },
    '.pr-legend-title': {
      //color: '#36383c',
      top: '5dp',
      bottom: '5dp',
      font: {
        fontSize: '20',
        fontWeight: 'bold'
      },
      width: Ti.UI.FILL,
      textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
      height: '23dp',
      //shadowColor: '#eeeeee',
      shadowOffset: {x:2, y:2}
    },

    '.pr-legend-label': {
      top: '3dp',
      //color: '#333333',
      font: {
        fontSize: '14',
        fontFamily: 'DroidSans'
      },
      width: Ti.UI.FILL,
      textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
      height: '16dp'
    },

    '.pr-legend-label-small': {
      top: '3dp',
      //color: '#555555',
      font: {
        fontSize: '12',
        fontFamily: 'DroidSans'
      },
      width: Ti.UI.FILL,
      textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
      height: '14dp'
    }

  },


  /*
    FORMS
  */

  '.pr-form': {
    layout: 'vertical'
  },

  '.pr-form-group': {
    borderRadius: '6dp',
    borderWidth: '2dp',
    borderColor: '#aa7942',
    width: Ti.UI.FILL,
    height: Ti.UI.SIZE,
    layout: 'vertical',

    'textField': {
      height: '40dp',
      width: Ti.UI.FILL,
      backgroundColor: '#eeeeee',
      color: '#555555',
      paddingLeft: '6dp',
      paddingRight: '6dp',
      autocapitalization: false,
      autocorrect: false,
      font: {
        fontSize: '18dp',
        fontFamily: 'DroidSans',
        fontWeight: 'bold'
      }

    },

    'textArea': {
      height: '80dp',
      width: Ti.UI.FILL,
      backgroundColor: '#eeeeee',
      color: '#555555',
      paddingLeft: '6dp',
      paddingRight: '6dp',
      autocapitalization: false,
      autocorrect: false,
      font: {
        fontSize: '16dp',
        fontFamily: 'DroidSans',
        fontWeight: 'bold'
      }

    },

    '.pr-border': {
      borderBottomWidth: '1dp',
      borderColor: '#999999',
    }
  },

  '.pr-field': {
    width: Ti.UI.FILL,
    height: Ti.UI.SIZE,
    layout: 'horizontal',
    top: '10dp'
  },

  '.pr-field-label-container': {
    width: Ti.UI.FILL,
    height: Ti.UI.SIZE,
    layout: 'horizontal'
  },

  '.pr-field-control-container': {
    width: Ti.UI.FILL,
    height: Ti.UI.SIZE,
    layout: 'horizontal'
  },

  '.pr-field-label': {
    height: '20dp',
    font: {
      fontSize: '20dp',
      fontFamily: 'Myriad Apple',
      fontWeight: 'bold'
    },
    color: '#583d2b',
    shadowColor: '#eeeeee',
    shadowOffset: {x:1, y:1}
  },

  '.pr-field-control-textfield': {
    top: '4dp',
    width: Ti.UI.FILL,
    height: '40dp',
    backgroundColor: '#eeeeee',
    border: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
    borderRadius: '4dp',
    borderWidth: '2dp',
    borderColor: '#aa7942',
    color: '#555555',
    paddingLeft: '6dp',
    paddingRight: '6dp',
    autocapitalization: false,
    autocorrect: false,
    font: {
      fontSize: '22dp',
      fontFamily: 'DroidSans',
      fontWeight: 'bold'
    }
  },



  /*
    !EVENTS
  */

  '.pr-list-events': {
    //backgroundImage: '/assets/windows/windowBg.png',
    //backgroundRepeat: true,
    //separatorColor: '#9e7258',
    width: Ti.UI.FILL,
    height: Ti.UI.FILL,

    '.pr-list-row-events': {
      height: '75dp',
      ipad: {
        height: '150dp'
      }
    },

    '.pr-list-row-container-events': {
      layout: 'horizontal',
      //backgroundColor: '#fcf3e2',
      height: '75dp',
      ipad: {
        height: '150dp'
      },

      '.pr-list-photo-events': {
        width: '75dp',
        height: '75dp',
        ipad: {
          width: '150dp',
          height: '150dp'
        }
      }
    },

    '.pr-list-label-container-events': {
      left: '5dp',
      right: '0dp',
      layout: 'vertical',
      width: Ti.UI.FILL,
      height: '75dp',

      ipad: {
        height: '150dp',
        left: '10dp',
      }
    },

    '.pr-list-label-events': {
      textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
      verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP,
      right: '0dp',
      left: '0dp',
      //color: '#5a3f2f',
      height: '19dp',
      //shadowColor: '#ffffff',
      shadowOffset: {x: 1, y: 1},
      font: {
        fontFamily: 'Droid Sans',
        fontSize: '16dp',
        fontWeight: 'bold'
      },
      ipad: {
        font: {
          fontFamily: 'Droid Sans',
          fontSize: '22dp',
          fontWeight: 'bold'
        },
        height: '23dp'
      }
    },

    '.pr-list-date-events': {
      textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
      verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP,
      //color: '#333333',
      left: '0dp',
      right: '0dp',
      top: '3dp',
      height: Ti.UI.SIZE,
      font: {
        fontFamily: 'Droid Sans',
        fontSize: '13dp'
      },
      ipad: {
        font: {
          fontFamily: 'Droid Sans',
          fontSize: '18dp'
        }
      }
    },

    '.pr-list-description-events': {
      textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
      verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP,
      left: '0dp',
      right: '0dp',
      ellipsize: true,
      height: Ti.UI.FILL,
      //color: '#555555',
      font: {
        fontFamily: 'Droid Sans',
        fontSize: '14dp'
      },
      ipad: {
        font: {
          fontFamily: 'Droid Sans',
          fontSize: '20dp'
        }
      }
    }

  },










  '.pr-list': {

    width: Ti.UI.FILL,

    'tableViewRow': {

      height: '75dp',
      //backgroundColor: 'green',
      layout: 'horizontal',

      '.pr-list-photo': {
        width: '75dp',
        height: '75dp'
      }

    }

  }

};