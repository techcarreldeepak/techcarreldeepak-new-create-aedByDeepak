const Joi = require("joi");

const batterySchema = Joi.object({
  battery_id: Joi.number().allow(null),
  battery_type: Joi.string().valid("has_battery").allow(null, ""),
  battery_expiration: Joi.string().allow(null, ""),
  battery_lot: Joi.string().allow(null, ""),
  spare: Joi.any().valid(null, false, true),
  battery_udi: Joi.string().allow(null, ""),
  battery_type_id: Joi.number().allow(null, ""),
  battery_part_number: Joi.string().allow(null, ""),
});

const battery10pakSchema = Joi.object({
  battery_id: Joi.number().allow(null),
  battery_type: Joi.string().valid("has_10pk").allow(null, ""),
  battery_expiration: Joi.string().allow(null, ""),
  date_installed: Joi.string().allow(null, ""),
  install_before_date: Joi.string().allow(null, ""),
  spare: Joi.any().valid(null, false, true),
  battery_udi: Joi.string().allow(null, ""),
  battery_type_id: Joi.number().allow(null, ""),
  battery_part_number: Joi.string().allow(null, ""),
});

const batteryHasManSchema = Joi.object({
  battery_id: Joi.number().allow(null),
  battery_type: Joi.string().valid("has_man").allow(null, ""),
  battery_expiration: Joi.string().allow(null, ""),
  battery_lot: Joi.string().allow(null, ""),
  battery_udi: Joi.string().allow(null, ""),
  v9_install: Joi.string().allow(null, ""),
  date_installed: Joi.string().allow(null, ""),
  manufactured_date: Joi.string().allow(null, ""),
  spare: Joi.any().valid(null, false, true),
  battery_udi: Joi.string().allow(null, ""),
  battery_type_id: Joi.number().allow(null, ""),
  battery_part_number: Joi.string().allow(null, ""),
});

const has9vSchema = Joi.object({
  battery_id: Joi.number().allow(null),
  battery_type: Joi.string().valid("has_9v").allow(null, ""),
  battery_expiration: Joi.string().allow(null, ""),
  battery_lot: Joi.string().allow(null, ""),
  v9_install: Joi.string().allow(null, ""),
  spare: Joi.any().valid(null, false, true),
  battery_udi: Joi.string().allow(null, ""),
  battery_part_number: Joi.string().allow(null, ""),
  v9_expiration_date: Joi.string().allow(null, ""),
  battery_type_id: Joi.number().allow(null, ""),
});

const padSchema = Joi.object({
  pad_id: Joi.number().allow(null),
  pad_expiration: Joi.string().allow(null, ""),
  pad_lot: Joi.string().allow(null, ""),
  pad_udi: Joi.string().allow(null, ""),
  pad_type: Joi.string()
    .valid("ADULT", "PEDIATRIC", "ADULT_PAD_PAK", "PEDIATRIC_PAD_PAK")
    .allow(null, ""),
  spare: Joi.any().valid(null, false, true, 0, 1),
  pediatric_key: Joi.any().valid(null, false, true, 0, 1),
  pad_type_id: Joi.number().allow(null, ""),
  pad_part_number: Joi.string().allow(null, ""),
});

const hasInstallBy = Joi.object({
  battery_id: Joi.number().allow(null),
  battery_type: Joi.string().valid("has_installby").allow(null, ""),
  battery_expiration: Joi.string().allow(null, ""),
  battery_lot: Joi.string().allow(null, ""),
  install_before_date: Joi.string().allow(null, ""),
  date_installed: Joi.string().allow(null, ""),
  battery_serial: Joi.string().allow(null, ""),
  spare: Joi.any().valid(null, false, true),
  battery_udi: Joi.string().allow(null, ""),
  battery_type_id: Joi.number().allow(null, ""),
  battery_part_number: Joi.string().allow(null, ""),
});

const updateAedValidation = Joi.object({
  updated_by: Joi.number().required(),
  expiration_date: Joi.string().allow(null, ""),
  last_service: Joi.number().allow(null, ""),
  ready_status: Joi.number().required(),
  is_deleted: Joi.number().required(),
  account_id: Joi.number().integer().required(),
  site_id: Joi.number().required(),
  brand_id: Joi.number().required(),
  model_id: Joi.number().required(),
  part_number: Joi.string().allow(null, ""),
  sub_model_id: Joi.number().allow(null, ""),
  serial: Joi.string().allow(null, ""),
  warranty_date: Joi.alternatives()
    .try(
      Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/), // Matches YYYY-MM-DD
      Joi.string().isoDate() // Matches ISO 8601 format
    )
    .allow(null, ""),
  // YYYY-MM-DD
  installed: Joi.alternatives()
    .try(
      Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/), // Matches YYYY-MM-DD
      Joi.string().isoDate() // Matches ISO 8601 format
    )
    .allow(null, ""), // YYYY-MM-DD
  batteries_expirations: Joi.array()
    .items(Joi.string().allow(null, ""))
    .allow(null, ""),
  adult_pad_exp_date: Joi.array()
    .items(Joi.string().allow(null, ""))
    .allow(null, ""),
  storage_info: Joi.array()
    .items(
      Joi.object({
        storage_type: Joi.number().allow(null, ""),
        alarmed: Joi.number().allow(null, ""),
        alarm_status: Joi.number().allow(null, ""),
        storage_part_name: Joi.string().allow(null, ""),
        v9_Installed_Date: Joi.string().allow(null, ""),
        expiry_date: Joi.string().allow(null, ""),
      })
    )
    .allow(null, ""),
  charge_pak_info: Joi.array()
    .items(
      Joi.object({
        battery_id: Joi.number().allow(null),
        battery_type: Joi.string().valid("charge_pak_info").allow(null, ""),
        charge_pak_part: Joi.string().allow(null, ""),
        charge_pak_udi: Joi.string().allow(null, ""),
        battery_expiration: Joi.string().allow(null, ""),
        battery_lot: Joi.string().allow(null, ""),
        pad_1_part: Joi.string().allow(null, ""),
        pad_1_expiration: Joi.string().allow(null, ""),
        pad_1_lot: Joi.string().allow(null, ""),
        pad_2_part: Joi.string().allow(null, ""),
        pad_2_expiration: Joi.string().allow(null, ""),
        pad_2_lot: Joi.string().allow(null, ""),
        spare: Joi.any().valid(null, false, true),
        charge_pak_pad_1_id: Joi.number().allow(null),
        charge_pak_pad_2_id: Joi.number().allow(null),
        pad_1_type_id: Joi.string().allow(null, ""),
        pad_2_type_id: Joi.string().allow(null, ""),
        charge_pak_type_id: Joi.number().allow(null, ""),
        pad_qty:Joi.number().allow(null)
      })
    )
    .allow(null, ""),
  asset: Joi.string().allow(null, ""),
  min_exp_date: Joi.string().allow(null, ""),
  invoice: Joi.string().allow(null, ""),
  custom_input: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().required(),
        label: Joi.string().allow(null, ""),
        val: Joi.string().allow(null, ""),
      })
    )
    .allow(null, ""),
  file_name: Joi.string().allow(null, ""),
  placement: Joi.string().allow(null, ""),
  purchase_type: Joi.string().valid("Own", "Leased", "Rental").allow(null, ""),
  purchase_date: Joi.date().iso().allow(null, ""), // ISO format for date
  spares_is_active: Joi.number().integer().valid(0, 1).required(),
  pediatric_is_active: Joi.number().integer().valid(0, 1).required(),
  rsm_is_active: Joi.number().integer().valid(0, 1).required(),
  out_of_service_is_active: Joi.number().integer().valid(0, 1).required(),
  rms_check: Joi.string().allow(null, ""),
  rms_info: Joi.array()
    .items(
      Joi.object({
        rms_brand: Joi.string().allow(null, ""),
        rms_name: Joi.string().allow(null, ""),
      })
    )
    .allow(null, ""),
  out_of_service_info: Joi.array()
    .items(
      Joi.object({
        date_sent_to_manufacturer: Joi.string().allow(null, ""),
        loaner_rental_serial: Joi.string().allow(null, ""),
        loaner_rental_serial_name: Joi.string().allow(null, ""),
        reason: Joi.string().allow(null, ""),
        not_replacing: Joi.boolean().required(),
        loaner_toggle: Joi.boolean().required(),
        replaced_serial: Joi.string().allow(null, ""),
        replaced_serial_name: Joi.string().allow(null, ""),
      })
    )
    .allow(null, ""),
  battery_info: Joi.array()
    .items(
      Joi.object({
        has_battery: Joi.array().items(batterySchema).allow(null, ""),
        has_9v: Joi.array().items(has9vSchema).allow(null, ""),
        has_installby: Joi.array().items(hasInstallBy).allow(null, ""),
        has_man: Joi.array().items(batteryHasManSchema).allow(null, ""),
        has_10pk: Joi.array().items(battery10pakSchema).allow(null, ""),
      })
    )
    .allow(null, ""),
  gateway_info: Joi.array()
    .items(
      Joi.object({
        installed: Joi.number().allow(null, ""),
        connected: Joi.number().allow(null, ""),
        gateway_serial: Joi.string().allow(null, ""),
        gateway_mac_address: Joi.string().allow(null, ""),
        battery_install_date: Joi.string().allow(null, ""),
        expiry_date: Joi.string().allow(null, ""),
      })
    )
    .allow(null, ""),
  pad_info: Joi.array().items(padSchema).allow(null, ""),
  builtin_RMS_info: Joi.array()
    .items(
      Joi.object({
        connected: Joi.boolean().required(),
        mac_address: Joi.string().allow(null, ""),
      })
    )
    .allow(null, ""),
  last_check: Joi.string().allow(null, ""),
  is_deleted_obj: Joi.array()
    .items({
      id: Joi.number().required().allow(null),
      type: Joi.string().required().allow("BATTERY", "PAD", "CHARGE_PAK"),
    })
    .allow(null, ""),
});

module.exports = { updateAedValidation };
