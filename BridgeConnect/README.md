# To setup a new client:


# Create a new function app in the azure portal
1- run the script  .\deploy.ps1 -CompanyName "{name_of_company}"

# In the azure portal, look for your function app under name_of_company

# Setup the following .env variables:

DB_CONNECTION ( the DB where anonymous references are sent to)
API_BEARER_TOKEN ( the permanent token we get from Email)
COMPANY_EMAIL (this email must exist in the API you are targetting)
SCHEDULE ( CRON job format, default is 20 minute)
WAIT_BETWEEN_API_CALLS_MS ( spam protection. default is 11 second)
API_URL (the API you are targetting, ex: https://pmt-roy-refemp-dev.momentum-tech.sh/api)

