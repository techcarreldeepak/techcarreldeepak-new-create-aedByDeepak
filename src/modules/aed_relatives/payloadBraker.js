const { sequelize } = require("./import");
const { createAedModel } = require("./aed/create/model.createAed");
const {
  createOutOfServiceInfoModel,
} = require("./outOfService/create/model.createOfs");
const { createBatteryModel } = require("./battery/create/model.createBattery");
const {
  createStorageInfoModel,
} = require("./storageInfo/create/model.createStorageInfo");
const { createPadsModel } = require("./pad/create/model.createPad");
const {
  createGatewayInfoModel,
} = require("./gatewayInfo/create/model.createGateway");
const {
  createCustomFieldModel,
} = require("./customeFields/create/model.createCustomeFields");
const { createRmsInfoModel } = require("./rmsInfo/create/model.createRmsInfo");

async function processPayload(payload, type) {
  const transaction = await sequelize.transaction();
  try {
    const {
      account_id,
      ready_status,
      expiration_date,
      last_service,
      created_by,
      is_deleted,
      site_id,
      brand_id,
      model_id,
      part_number,
      sub_model_id,
      serial,
      warranty_date,
      asset,
      rms_check,
      file_name,
      installed,
      purchase_type,
      purchase_date,
      invoice,
      placement,
      spares_is_active,
      pediatric_is_active,
      rsm_is_active,
      out_of_service_is_active,
      custom_input = [],
      rms_info = [],
      out_of_service_info = [],
      battery_info = [],
      storage_info = [],
      pad_info = [],
      charge_pak_info = [],
      gateway_info = [],
      builtin_RMS_info = [],
    } = payload;

    const aed_data = {
      account_id,
      ready_status,
      expiration_date,
      last_service,
      created_by,
      is_deleted,
      site_id,
      brand_id,
      model_id,
      part_number,
      sub_model_id,
      serial,
      warranty_date,
      asset,
      rms_check,
      file_name,
      installed,
      purchase_type,
      purchase_date,
      invoice,
      placement,
      spares_is_active,
      pediatric_is_active,
      rsm_is_active,
      out_of_service_is_active,
    };

    if (type === "create") {
      const { data } = await createAedModel(aed_data, transaction);
      if (data.aedId) {
        const aed_id = data.aedId;
        const created_by = data.created_by;
        await Promise.all([
          ...out_of_service_info.map(
            ({ ...info }) =>
              createOutOfServiceInfoModel(
                { ...info, aed_id, created_by },
                transaction
              ) // Pass aed_id
          ),
          ...battery_info.map((info) =>
            createBatteryModel({ ...info, aed_id, created_by }, transaction)
          ), // Pass aed_id
          ...storage_info.map(
            (info) =>
              createStorageInfoModel(
                { ...info, aed_id, created_by },
                transaction
              ) // Pass aed_id
          ),
          ...pad_info.map((info) =>
            createPadsModel({ ...info, aed_id, created_by }, transaction)
          ), // Pass aed_id
          ...charge_pak_info.map(async (info) => {
            const pad1_id = info.pad_1_part
              ? await createPadsModel(
                  {
                    aed_id,
                    part: info.pad_1_part,
                    pad_expiration: info.pad_1_expiration,
                    pad_lot: info.pad_1_lot,
                    pad_type: "CHARGE_PAK",
                    created_by,
                  },
                  transaction
                )
              : null;

            // Step 2: Create pad_2 if its part exists
            const pad2_id = info.pad_2_part
              ? await createPadsModel(
                  {
                    aed_id,
                    part: info.pad_2_part,
                    pad_expiration: info.pad_2_expiration,
                    pad_lot: info.pad_2_lot,
                    pad_type: "CHARGE_PAK",
                    created_by,
                  },
                  transaction
                )
              : null;

            // Step 3: Use created pad IDs in battery model creation
            return createBatteryModel(
              {
                charge_pak_info: [
                  {
                    ...info,
                    aed_id,
                    created_by,
                    charge_pad_1_id: pad1_id.pad_id,
                    charge_pad_2_id: pad2_id.pad_id,
                  },
                ],
              },
              transaction
            );
          }), // Pass aed_id
          ...gateway_info.map((info) =>
            createGatewayInfoModel({ ...info, aed_id, created_by }, transaction)
          ), // Pass aed_id
          ...custom_input.map((info) =>
            createCustomFieldModel({ ...info, aed_id, created_by }, transaction)
          ), // Pass aed_id
          ...rms_info.map((info) =>
            createRmsInfoModel({ ...info, aed_id, created_by }, transaction)
          ), // Pass aed_id
          ...builtin_RMS_info.map((info) =>
            createRmsInfoModel({ ...info, aed_id, created_by }, transaction)
          ), // Pass aed_id
        ]);
      }
    }

    // else if (type === "update") {
    //   await updateAedModel(aed_data, { transaction });

    //   // Update entries for multiple models using map
    //   await Promise.all([
    //     ...out_of_service_info.map((info) =>
    //       updateOutOfServiceInfoModel(info, { transaction })
    //     ),
    //     ...battery_info.map((info) =>
    //       updateBatteryModel(info, { transaction })
    //     ),
    //     ...storage_info.map((info) =>
    //       updateStorageInfoModel(info, { transaction })
    //     ),
    //     ...adult_pad_info.map((info) => updatePadsModel(info, { transaction })),
    //     ...charge_pak_info.map((info) =>
    //       updateChargePakModel(info, { transaction })
    //     ),
    //     ...spare_battery_info.map((info) =>
    //       updateSpareBatteryModel(info, { transaction })
    //     ),
    //     ...spare_charge_pak_info.map((info) =>
    //       updateChargePakModel(info, { transaction })
    //     ), // Adjust accordingly
    //     ...spare_adult_pad_info.map((info) =>
    //       updatePadsModel(info, { transaction })
    //     ), // Adjust accordingly
    //     ...adult_pad_pak_info.map((info) =>
    //       updatePadsModel(info, { transaction })
    //     ), // Adjust accordingly
    //     ...pediatric_pad_info.map((info) =>
    //       updatePediatricPadModel(info, { transaction })
    //     ),
    //     ...pediatric_pak_pad_info.map((info) =>
    //       updatePediatricPadModel(info, { transaction })
    //     ), // Adjust accordingly
    //     ...spare_padric_pad_info.map((info) =>
    //       updatePadsModel(info, { transaction })
    //     ), // Adjust accordingly
    //     ...gateway_info.map((info) =>
    //       updateGatewayInfoModel(info, { transaction })
    //     ),
    //     // Add any other models as needed
    //   ]);
    // }
    await transaction.commit();
    return {
      success: true,
      message: "Aed created successfully",
    };
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    return {
      success: true,
      message: error.message,
    };
  }
}

module.exports = {
  processPayload,
};
