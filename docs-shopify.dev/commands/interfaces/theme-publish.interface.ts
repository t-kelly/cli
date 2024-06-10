// This is an autogenerated file. Don't edit this file manually.
export interface themepublish {
  /**
   * The environment to apply to the current command.
   * @environment SHOPIFY_FLAG_ENVIRONMENT
   */
  '-e, --environment <value>'?: string

  /**
   * Skip confirmation.
   * @environment SHOPIFY_FLAG_FORCE
   */
  '-f, --force'?: ''

  /**
   * Disable color output.
   * @environment SHOPIFY_FLAG_NO_COLOR
   */
  '--no-color'?: ''

  /**
   * Password generated from the Theme Access app.
   * @environment SHOPIFY_CLI_THEME_TOKEN
   */
  '--password <value>'?: string

  /**
   * Store URL. It can be the store prefix (johns-apparel) or the full myshopify.com URL (johns-apparel.myshopify.com, https://johns-apparel.myshopify.com).
   * @environment SHOPIFY_FLAG_STORE
   */
  '-s, --store <value>'?: string

  /**
   * Theme ID or name of the remote theme.
   * @environment SHOPIFY_FLAG_THEME_ID
   */
  '-t, --theme <value>'?: string

  /**
   * Increase the verbosity of the output.
   * @environment SHOPIFY_FLAG_VERBOSE
   */
  '--verbose'?: ''
}
