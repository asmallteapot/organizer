"""
Django settings for organizer project.

Generated by 'django-admin startproject' using Django 1.11.1.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.11/ref/settings/
"""

import os
import raven
import dj_database_url

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', None)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = ('DEBUG' in os.environ)

if 'ALLOWED_HOSTS' in os.environ:
    ALLOWED_HOSTS = os.environ['ALLOWED_HOSTS'].split(',')
else:
    ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_nose',
    'anymail',
    'address',
    'rest_framework',
    'markdownify',
    'webpack_loader',
    'raven.contrib.django.raven_compat',
    'social_django',
    'django_rq',
    'taggit',
    'taggit_serializer',
    'crm',
]

TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

NOSE_ARGS = [
    '--with-coverage',
    '--cover-package=organizer,crm',
    '--with-xunit',
    '--xunit-file=./test-results/nose/results.xml'
]

CACHES = {
    'default': {
        'BACKEND': 'redis_cache.RedisCache',
        'LOCATION': os.getenv('REDISTOGO_URL', 'redis://localhost:6379/0')
    }
}

RQ_QUEUES = {
    'default': {
        'USE_REDIS_CACHE': 'default'
    }
}

MARKDOWNIFY_WHITELIST_TAGS = [
    'a', 'abbr', 'acronym', 'b', 'blockquote', 'em', 'i', 'li', 'ol', 'p',
    'string', 'ul', 'img'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'organizer.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['templates/', 'assets/bundles/'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'crm.context.add_user_data',
                'crm.context.add_settings',
            ],
        },
    },
]

WSGI_APPLICATION = 'organizer.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.11/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

db_from_env = dj_database_url.config(conn_max_age=500)
DATABASES['default'].update(db_from_env)

SOCIAL_AUTH_URL_NAMESPACE = 'social'

# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.11/howto/static-files/
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'assets')
]

WEBPACK_LOADER = {
    'DEFAULT': {
        'BUNDLE_DIR_NAME': 'bundles/',
        'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats.json')
    }
}

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

ANYMAIL = {
    'MAILGUN_API_KEY': os.environ.get('MAILGUN_API_KEY', None),
    'MAILGUN_SENDER_DOMAIN': os.environ.get('MAILGUN_DOMAIN', None),
    'WEBOOK_AUTHORIZATION': os.environ.get('ANYMAIL_WEBHOOK_AUTHORIZATION', None)
}

EMAIL_BACKEND = 'anymail.backends.mailgun.EmailBackend'
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', None)

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAdminUser',
    ],
    'PAGE_SIZE': 100
}

RAVEN_CONFIG = {
    'dsn': os.environ.get("SENTRY_DSN")
}

DEFAULT_CHARSET="utf-8"

GOOGLE_MAPS_KEY = os.environ.get('GOOGLE_MAPS_KEY', None)

AIRTABLE_API_KEY = os.environ.get('AIRTABLE_API_KEY', None)
AIRTABLE_BASE_ID = os.environ.get('AIRTABLE_BASE_ID', None)
AIRTABLE_TABLE_NAME = os.environ.get('AIRTABLE_TABLE_NAME', None)

DISCOURSE_BASE_URL = os.environ.get('DISCOURSE_BASE_URL', None)
DISCOURSE_SSO_SECRET = os.environ.get('DISCOURSE_SSO_SECRET', None)

SOCIAL_AUTH_SLACK_KEY = os.environ.get('SLACK_KEY', None)
SOCIAL_AUTH_SLACK_SECRET = os.environ.get('SLACK_SECRET', None)
SOCIAL_AUTH_SLACK_SLACK_SCOPE = ['identity.basic','identity.team',
        'identity.email']
SOCIAL_AUTH_SLACK_TEAM = os.environ.get('SLACK_TEAM_ID', None)

AUTHENTICATION_BACKENDS = ()

if DISCOURSE_SSO_SECRET is not None:
    AUTHENTICATION_BACKENDS += ('organizer.auth.DiscourseSSOAuth',)

if SOCIAL_AUTH_SLACK_KEY is not None:
    if SOCIAL_AUTH_SLACK_TEAM is None:
        raise EnvironmentError("You must set a slack team/workspace ID to enable slack logins. I will not allow this to be open to all workspaces.")
    AUTHENTICATION_BACKENDS += ('social_core.backends.slack.SlackOAuth2',)
