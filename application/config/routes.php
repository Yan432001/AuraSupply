<?php
defined('BASEPATH') or exit('No direct script access allowed');

/*
|--------------------------------------------------------------------------
| AuraSupply /admins and Core Routes
|--------------------------------------------------------------------------
*/
$route['default_controller'] = 'admins/auth/login';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;

// Authentication Routes under /admins
$route['admins/login']             = 'admins/auth/login';
$route['admins/logout']            = 'admins/auth/logout';

// Dashboard & Core Admin Area
$route['admins']                   = 'admins/dashboard/index';
$route['admins/dashboard']         = 'admins/dashboard/index';

// Roles & Permissions Management
$route['admins/permissions']              = 'admins/permissions/index';
$route['admins/permissions/edit/(:num)']  = 'admins/permissions/edit/$1';
$route['admins/permissions/(:num)']       = 'admins/permissions/edit/$1';

// Products Module Routes
$route['admins/products']          = 'admins/products/index';
$route['admins/products/add']      = 'admins/products/add';
$route['admins/products/edit/(:num)'] = 'admins/products/edit/$1';
$route['admins/products/delete/(:num)'] = 'admins/products/delete/$1';

// Fallback for sub-controllers under admins/
$route['admins/(:any)']            = 'admins/$1';
