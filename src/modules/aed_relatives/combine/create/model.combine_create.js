const { sequelize } = require("../../import");
const { logAedUpdates } = require("../update/update_logs");
const create_combine_model = async (data) => {
  try {
    return await sequelize.transaction(async (transaction) => {
      const aedData = {
        account_id: data.account_id,
        site_id: data.site_id,
        brand_id: data.brand_id,
        model_id: data.model_id,
        sub_model_id: data.sub_model_id || null,
        serial: data.serial || null,
        asset: data.asset || null,
        placement: data.placement || null,
        purchase_type: data.purchase_type || null,
        purchase_date: data.purchase_date || null,
        spares_is_active: data.spares_is_active,
        pediatric_is_active: data.pediatric_is_active,
        rsm_is_active: data.rsm_is_active,
        out_of_service_is_active: data.out_of_service_is_active,
        created_at: new Date(),
        created_by: data.created_by,
        is_deleted: data.is_deleted,
        warranty_date: data.warranty_date || null,
        installed: data.installed || null,
        invoice: data.invoice || null,
        ready_status: data.ready_status || null,
        expiration_date: data.expiration_date || null,
        last_check: data.last_check || null,
        last_service: data.last_service || null,
        rms_check: data.rms_check || null,
      };

      // Insert into aed_data table and get the last inserted ID as aed_id
      const [aedDataResult] = await sequelize.query(
        `
        INSERT INTO aed_data (
          account_id, site_id, brand_id, model_id, sub_model_id, serial, asset, placement, 
          purchase_type, purchase_date, spares_is_active, pediatric_is_active, rsm_is_active, 
          out_of_service_is_active, created_at, created_by, is_deleted, warranty_date, 
          installed, invoice, ready_status, expiration_date, last_check, last_service, rms_check
        ) VALUES (
          :account_id, :site_id, :brand_id, :model_id, :sub_model_id, :serial, :asset, :placement, 
          :purchase_type, :purchase_date, :spares_is_active, :pediatric_is_active, :rsm_is_active, 
          :out_of_service_is_active, NOW(), :created_by, :is_deleted, :warranty_date, :installed, 
          :invoice, :ready_status, :expiration_date, :last_check, :last_service, :rms_check
        )`,
        {
          replacements: aedData,
          transaction,
        }
      );

      const [result] = await sequelize.query(
        `SELECT LAST_INSERT_ID() AS aed_id`,
        { transaction }
      );
      const aed_id = result[0].aed_id;

      // Ensure aed_id is valid before proceeding
      if (!aed_id) {
        throw new Error("Failed to retrieve aed_id from aed_data insertion");
      }
      logAedUpdates(aed_id, data.created_by, data);
      // Bulk insert custom_fields table
      const customFieldsData = data.custom_input.map((field) => ({
        aed_id,
        custom_field_name: field.label,
        custom_field_value: field.val,
        created_by: data.created_by,
        created_at: new Date(),
      }));

      if (data.custom_input && data.custom_input.length > 0) {
        await sequelize.queryInterface.bulkInsert(
          "custom_fields",
          customFieldsData,
          { transaction }
        );
      }
      // Bulk insert rms_info table
      const rmsData = data.rms_info.map((rms) => ({
        aed_id,
        is_built_in: 0,
        connected: rms.connected,
        mac_address: rms.mac_address || null,
        rms_brand_id: rms.rms_brand,
        rms_name: rms.rms_name,
        created_by: data.created_by,
        created_at: new Date(),
      }));

      await sequelize.queryInterface.bulkInsert("rms_info", rmsData, {
        transaction,
      });

      // Bulk insert out_of_service_info table
      const outOfServiceData = data.out_of_service_info.map((outService) => ({
        aed_id,
        replacing: outService.not_replacing ? 1 : 0,
        replaced_serial: outService.replaced_serial || null,
        loaner: outService.loaner_toggle ? 1 : 0,
        loaner_serial: outService.loaner_rental_serial || null,
        date_sent_to_manufacturer: outService.date_sent_to_manufacturer || null,
        reason: outService.reason || null,
        created_by: data.created_by,
        created_at: new Date(),
      }));

      await sequelize.queryInterface.bulkInsert(
        "out_of_service_info",
        outOfServiceData,
        { transaction }
      );

      // Bulk insert battery_information table
      const batteryData = data.battery_info
        .flatMap((battery) =>
          Object.keys(battery).flatMap((key) => {
            // Check if the battery type array is not empty
            if (Array.isArray(battery[key]) && battery[key].length > 0) {
              return battery[key].map((batteryType) => ({
                aed_id,
                battery_type: batteryType.battery_type || key,
                battery_part_number: batteryType.battery_part_number || null,
                battery_serial: batteryType.battery_serial || null,
                install_before_date: batteryType.install_before_date || null,
                battery_type_id: batteryType.battery_type_id || null,
                manufactured_date: batteryType.manufactured_date || null,
                installed_date: batteryType.date_installed || null,
                battery_lot: batteryType.battery_lot || null,
                battery_udi: batteryType.battery_udi || null,
                battery_expiration: batteryType.battery_expiration || null,
                v9_install_date: batteryType.v9_install || null,
                v9_expiration_date: batteryType.v9_expiration_date || null,
                spare: batteryType.spare ? 1 : 0,
                created_by: data.created_by,
                created_at: new Date(),
              }));
            }
            return []; // Return an empty array if the battery type array is empty
          })
        )
        .filter((entry) =>
          Object.values(entry).some((val) => val !== null && val !== undefined)
        );
      console.log({ batteryData });
      if (
        data.battery_info &&
        data.battery_info.some((battery) => Object.keys(battery).length > 0)
      ) {
        await sequelize.queryInterface.bulkInsert(
          "battery_information",
          batteryData,
          { transaction }
        );
      }

      // Bulk insert pads table
      const padData = data.pad_info.map((pad) => ({
        aed_id,
        pad_type_id: pad.pad_type_id,
        pad_lot: pad.pad_lot || null,
        pad_type: pad.pad_type || null,
        pediatric_key: pad.pediatric_key ? 1 : 0,
        pad_uid: pad.pad_udi || null,
        spare: pad.spare ? 1 : 0,
        pad_expiration: pad.pad_expiration || null,
        pad_part_number: pad.pad_part_number || null,
        created_by: data.created_by,
        created_at: new Date(),
      }));
      if (data.pad_info && data.pad_info.length > 0) {
        await sequelize.queryInterface.bulkInsert("pads", padData, {
          transaction,
        });
      }
      // Bulk insert gateway_info table
      const gatewayData = data.gateway_info.map((gateway) => ({
        aed_id,
        installed: gateway.installed || null,
        expiry_date: gateway.expiry_date || null,
        connected: gateway.connected || null,
        gateway_serial: gateway.gateway_serial || null,
        gateway_mac_address: gateway.gateway_mac_address || null,
        battery_install_date: gateway.battery_install_date || null,
        created_by: data.created_by,
        created_at: new Date(),
      }));

      await sequelize.queryInterface.bulkInsert("gateway_info", gatewayData, {
        transaction,
      });

      // Bulk insert storage_information table
      const storageData = data.storage_info.map((storage) => ({
        aed_id,
        storage_type_id: storage.storage_type || null,
        alarmed: storage.alarmed ? 1 : 0,
        alarm_status: storage.alarm_status ? 1 : 0,
        installed_date: storage.v9_Installed_Date || null,
        v9_expiration_date: storage.expiry_date || null,
        created_at: new Date(),
        created_by: data.created_by,
      }));

      await sequelize.queryInterface.bulkInsert(
        "storage_information",
        storageData,
        { transaction }
      );

      const builtinRmsData = data.builtin_RMS_info.map((rms) => ({
        aed_id,
        is_built_in: 1,
        connected: rms.connected,
        mac_address: rms.mac_address || null,
        rms_brand_id: rms.rms_brand,
        rms_name: rms.rms_name,
        created_by: data.created_by,
        created_at: new Date(),
      }));

      await sequelize.queryInterface.bulkInsert("rms_info", builtinRmsData, {
        transaction,
      });
      // Prepare charge pak data

      const chargePakData = [];
      // console.log({ data: data.charge_pak_info });
      await Promise.all(
        data.charge_pak_info.map(async (info) => {
          let pad1_id = null;
          let pad2_id = null;

          if (info.pad_1_part) {
            const pad1Data = {
              aed_id,
              pad_type_id: info.pad_1_type_id,
              pad_expiration: info.pad_1_expiration,
              pad_lot: info.pad_1_lot,
              pad_part_number: info.pad_1_part,
              pad_type: info.spare ? "CHARGE_PAK_SPARE" : "CHARGE_PAK",
              spare: info.spare ? 1 : 0,
              created_by: data.created_by,
              created_at: new Date(),
            };

            // Insert pad1 and get pad_id
            await sequelize.queryInterface.bulkInsert("pads", [pad1Data], {
              transaction,
            });
            const [[{ pad_id }]] = await sequelize.query(
              `SELECT LAST_INSERT_ID() AS pad_id;`,
              { transaction }
            );
            pad1_id = pad_id; // Store pad1_id
          }

          if (info.pad_2_part) {
            const pad2Data = {
              aed_id,
              pad_type_id: info.pad_2_type_id,
              pad_expiration: info.pad_2_expiration,
              pad_lot: info.pad_2_lot,
              pad_part_number: info.pad_2_part,
              pad_type: info.spare ? "CHARGE_PAK_SPARE" : "CHARGE_PAK",
              spare: info.spare ? 1 : 0,
              created_by: data.created_by,
              created_at: new Date(),
            };

            // Insert pad2 and get pad_id
            await sequelize.queryInterface.bulkInsert("pads", [pad2Data], {
              transaction,
            });
            const [[{ pad_id }]] = await sequelize.query(
              `SELECT LAST_INSERT_ID() AS pad_id;`,
              { transaction }
            );
            pad2_id = pad_id; // Store pad2_id
          }

          // Prepare the charge pak entry
          chargePakData.push({
            aed_id,
            charge_pak_pad_1_id: pad1_id, // Use retrieved pad1_id
            charge_pak_pad_2_id: pad2_id, // Use retrieved pad2_id
            battery_type: info.battery_type,
            manufactured_date: info.manufactured_date,
            battery_part_number: info.charge_pak_part,
            installed_date: info.installed_date,
            battery_lot: info.battery_lot,
            battery_udi: info.charge_pak_uid,
            battery_expiration: info.battery_expiration,
            v9_Install_date: info.v9_Install_date,
            install_before_date: info.install_before_date,
            battery_serial: info.battery_serial,
            spare: info.spare,
            created_at: new Date(),
            created_by: data.created_by,
            battery_type_id: info.charge_pak_type_id,
          });
        })
      );
      console.log({ chargePakData });
      if (data.charge_pak_info && data.charge_pak_info.length > 0) {
        console.log("runs");
        await sequelize.queryInterface.bulkInsert(
          "battery_information",
          chargePakData,
          { transaction }
        );
      }

      // Return success response
      return { success: true, message: "Aed created successfully", aed_id };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { create_combine_model };
