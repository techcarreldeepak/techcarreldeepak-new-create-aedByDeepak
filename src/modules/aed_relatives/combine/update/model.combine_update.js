const { sequelize } = require("../../import");
const { deleteItems } = require("./is_deleted_model");
const { logAedUpdates } = require("./update_logs");

const update_combine_model = async (data, aed_id) => {
  try {
    return await sequelize.transaction(async (transaction) => {
      logAedUpdates(aed_id, data.updated_by, data);
      const aedData = {};
      const keysToCheck = [
        "account_id",
        "site_id",
        "brand_id",
        "model_id",
        "sub_model_id",
        "serial",
        "asset",
        "placement",
        "purchase_type",
        "purchase_date",
        "warranty_date",
        "installed",
        "invoice",
        "ready_status",
        "expiration_date",
        "last_check",
        "last_service",
        "rms_check",
        "spares_is_active",
        "pediatric_is_active",
        "rsm_is_active",
        "out_of_service_is_active",
      ];

      // Include updated_by and updated_at
      const currentTimestamp = new Date();

      for (const key of keysToCheck) {
        if (data[key] != null) {
          aedData[key] = data[key];
        }
      }

      // Update aed_data only if there are changes
      if (Object.keys(aedData).length > 0) {
        await sequelize.queryInterface.bulkUpdate(
          "aed_data",
          {
            ...aedData,
            updated_by: data.updated_by,
            updated_at: currentTimestamp,
          },
          { aed_id },
          { transaction }
        );
      }

      deleteItems(data.is_deleted_obj, transaction);
      // Update custom_fields table with only modified fields
      if (data.custom_input && Array.isArray(data.custom_input)) {
        for (const field of data.custom_input) {
          if (field && field.val != null && field.label) {
            await sequelize.queryInterface.bulkUpdate(
              "custom_fields",
              {
                custom_field_value: field.val,
                custom_field_name: field.label,
                updated_by: data.updated_by,
                updated_at: currentTimestamp,
              },
              { aed_id, id: field.id },
              { transaction }
            );
          }
        }
      }

      // Helper function to update a table with data
      const updateOrInsertTable = async (tableName, dataArray, where, type) => {
        if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
          return;
        }

        for (const item of dataArray) {
          const whereCondition = { ...where, aed_id };

          if (type === "PADS" && !item.pad_id && item.pad_id === null) {
            console.log(item);
            await sequelize.queryInterface.bulkInsert(
              tableName,
              [
                {
                  ...item,
                  aed_id,
                  created_by: data.updated_by,
                  created_at: currentTimestamp,
                },
              ],
              { transaction }
            );
          } else if (type === "BATTERY" && !item.bi_id && item.bi_id === null) {
            console.log(item);
            await sequelize.queryInterface.bulkInsert(
              tableName,
              [
                {
                  ...item,
                  aed_id,
                  created_by: data.updated_by,
                  created_at: currentTimestamp,
                },
              ],
              { transaction }
            );
          } else if (
            type === "CHARGE_PAK" &&
            !item.bi_id &&
            item.bi_id === null
          ) {
            console.log("runs");
            const chargePakData = [];

            console.log(item);

            let pad1_id = null;
            let pad2_id = null;

            // Insert pad_1 if part info exists
            if (item.pad_1_part) {
              const pad1Data = {
                pad_type_id: item.pad_1_type_id,
                pad_part_number: item.pad_1_part,
                aed_id,
                pad_expiration: item.pad_1_expiration,
                pad_lot: item.pad_1_lot,
                pad_type: "CHARGE_PAK",
                created_by: data.updated_by,
                created_at: currentTimestamp,
                spare: item.spare ? 1 : 0,
              };
              await sequelize.queryInterface.bulkInsert("pads", [pad1Data], {
                transaction,
              });
              const [[{ pad_id }]] = await sequelize.query(
                `SELECT LAST_INSERT_ID() AS pad_id;`,
                { transaction }
              );
              pad1_id = pad_id; // Store retrieved pad1_id
            }

            // Insert pad_2 if part info exists
            if (item.pad_2_part) {
              const pad2Data = {
                pad_type_id: item.pad_2_type_id,
                pad_part_number: item.pad_2_part,
                aed_id,
                pad_expiration: item.pad_2_expiration,
                pad_lot: item.pad_2_lot,
                pad_type: "CHARGE_PAK",
                created_by: data.updated_by,
                created_at: new Date(),
                spare: item.spare ? 1 : 0,
              };
              await sequelize.queryInterface.bulkInsert("pads", [pad2Data], {
                transaction,
              });
              const [[{ pad_id }]] = await sequelize.query(
                `SELECT LAST_INSERT_ID() AS pad_id;`,
                { transaction }
              );
              pad2_id = pad_id; // Store retrieved pad2_id
            }
            console.log({ pad1_id, pad2_id });
            // Prepare charge_pak data with pad references
            chargePakData.push({
              aed_id,
              charge_pak_pad_1_id: pad1_id,
              charge_pak_pad_2_id: pad2_id,
              battery_type: item.battery_type,
              manufactured_date: item.manufactured_date,
              installed_date: item.installed_date,
              battery_lot: item.battery_lot,
              battery_udi: item.battery_udi,
              battery_part_number: item.battery_part_number,
              battery_type_id: item.battery_type_id || null,
              battery_expiration: item.battery_expiration,
              v9_Install_date: item.v9_Install_date,
              install_before_date: item.install_before_date,
              battery_serial: item.battery_serial,
              spare: item.spare,
              created_at: currentTimestamp,
              created_by: data.updated_by,
            });

            // Insert charge_pak data if available
            if (chargePakData.length > 0) {
              await sequelize.queryInterface.bulkInsert(
                "battery_information",
                chargePakData,
                { transaction }
              );
            }
          } else if (type === "CHARGE_PAK" && item.bi_id) {
            console.log("runs");
            console.log(item);

            // Handle pad deletion when pad_qty is 1

            // Handle pad_1 details
            if (item.pad_1_part) {
              const pad1Data = {
                pad_type_id: item.pad_1_type_id || null,
                pad_part_number: item.pad_1_part || null,
                aed_id: aed_id || null,
                pad_expiration: item.pad_1_expiration || null,
                pad_lot: item.pad_1_lot || null,
                pad_type: "CHARGE_PAK",
                updated_by: data.updated_by || null,
                updated_at: currentTimestamp || null,
                spare: item.spare ? 1 : 0,
              };

              if (item.charge_pak_pad_1_id) {
                // Update pad_1 if charge_pak_pad_1_id exists
                await sequelize.queryInterface.bulkUpdate(
                  "pads",
                  pad1Data,
                  { pad_id: item.charge_pak_pad_1_id },
                  { transaction }
                );
              } else {
                // Insert pad_1 if charge_pak_pad_1_id is null
                pad1Data.created_by = data.updated_by || null; // Add created_by field for insert
                pad1Data.created_at = currentTimestamp || null; // Add created_at field for insert
                pad1Data.spare = item.spare;
                const result = await sequelize.queryInterface.bulkInsert(
                  "pads",
                  [pad1Data],
                  { transaction }
                );
                const [[{ pad_id }]] = await sequelize.query(
                  `SELECT LAST_INSERT_ID() AS pad_id;`,
                  { transaction }
                );

                item.charge_pak_pad_1_id = pad_id; // Set the generated pad_id for further use
              }
            }

            // Handle pad_2 details
            if (item.pad_2_part && item.pad_qty !== 1) {
              const pad2Data = {
                pad_type_id: item.pad_2_type_id || null,
                pad_part_number: item.pad_2_part || null,
                aed_id: aed_id || null,
                pad_expiration: item.pad_2_expiration || null,
                pad_lot: item.pad_2_lot || null,
                pad_type: "CHARGE_PAK",
                updated_by: data.updated_by || null,
                updated_at: currentTimestamp || null,
                spare: item.spare ? 1 : 0,
              };

              if (item.charge_pak_pad_2_id) {
                // Update pad_2 if charge_pak_pad_2_id exists
                await sequelize.queryInterface.bulkUpdate(
                  "pads",
                  pad2Data,
                  { pad_id: item.charge_pak_pad_2_id },
                  { transaction }
                );
              } else {
                // Insert pad_2 if charge_pak_pad_2_id is null
                pad2Data.created_by = data.updated_by || null; // Add created_by field for insert
                pad2Data.created_at = currentTimestamp || null; // Add created_at field for insert
                pad2Data.spare = item.spare;
                const result = await sequelize.queryInterface.bulkInsert(
                  "pads",
                  [pad2Data],
                  { transaction }
                );
                const [[{ pad_id }]] = await sequelize.query(
                  `SELECT LAST_INSERT_ID() AS pad_id;`,
                  { transaction }
                );

                item.charge_pak_pad_2_id = pad_id; // Set the generated pad_id for further use
              }
            }

            if (item.pad_qty === 1) {
              console.log({ c: item.pad_qty })
              if (item.charge_pak_pad_1_id && item.charge_pak_pad_2_id) {
                // Delete pad associated with charge_pak_pad_2_id
                await sequelize.queryInterface.bulkDelete(
                  "pads",
                  { pad_id: item.charge_pak_pad_2_id },
                  { transaction }
                );
                // Set charge_pak_pad_2_id to null
                item.charge_pak_pad_2_id = null;
              }
            }
            // Update charge_pak data
            const chargePakData = {
              aed_id: aed_id || null,
              charge_pak_pad_1_id: item.charge_pak_pad_1_id || null,
              charge_pak_pad_2_id: item.charge_pak_pad_2_id || null,
              battery_type: item.battery_type || null,
              manufactured_date: item.manufactured_date || null,
              installed_date: item.installed_date || null,
              battery_lot: item.battery_lot || null,
              battery_udi: item.battery_udi || null,
              battery_part_number: item.battery_part_number || null,
              battery_expiration: item.battery_expiration || null,
              v9_Install_date: item.v9_Install_date || null,
              install_before_date: item.install_before_date || null,
              battery_serial: item.battery_serial || null,
              battery_type_id: item.battery_type_id || null,
              spare: item.spare,
              updated_at: currentTimestamp || null,
              updated_by: data.updated_by || null,
            };

            await sequelize.queryInterface.bulkUpdate(
              "battery_information",
              chargePakData,
              { bi_id: item.bi_id },
              { transaction }
            );
          } else {
            const {
              pad_1_part,
              pad_1_expiration,
              pad_1_lot,
              pad_1_type_id,
              pad_2_part,
              pad_2_expiration,
              pad_2_lot,
              pad_2_type_id,
              ...filteredItem
            } = item;

            await sequelize.queryInterface.bulkUpdate(
              tableName,
              {
                ...filteredItem, // Use the filtered item without the excluded fields
                updated_by: data.updated_by,
                updated_at: currentTimestamp,
              },
              whereCondition,
              { transaction }
            );
          }
        }
      };

      // Update rms_info table
      if (data.rms_info) {
        const rmsInfoData = data.rms_info
          .filter((rms) => rms) // Filter out null/undefined entries
          .map((rms) => ({
            connected: rms.connected ?? null,
            mac_address: rms.mac_address || null,
            rms_brand_id: rms.rms_brand || null,
            rms_name: rms.rms_name || null,
          }))
          .filter((item) => Object.values(item).some((val) => val !== null)); // Only include items with at least one non-null value

        await updateOrInsertTable("rms_info", rmsInfoData, { is_built_in: 0 });
      }

      if (data.builtin_RMS_info) {
        const builtInRMSInfoData = data.builtin_RMS_info
          .filter((rms) => rms)
          .map((rms) => ({
            connected: rms.connected ?? null,
            mac_address: rms.mac_address || null,
            rms_brand_id: rms.rms_brand || null,
            rms_name: rms.rms_name || null,
          }))
          .filter((item) => Object.values(item).some((val) => val !== null));

        await updateOrInsertTable("rms_info", builtInRMSInfoData, {
          is_built_in: 1,
        });
      }

      // Update out_of_service_info table
      if (data.out_of_service_info) {
        const outServiceInfoData = data.out_of_service_info
          .filter((outService) => outService)
          .map((outService) => ({
            ofs_id: outService.ofs_id,
            replacing: outService.not_replacing ? 1 : 0,
            replaced_serial: outService.replaced_serial_name || null,
            loaner: outService.loaner_toggle ? 1 : 0,
            loaner_serial: outService.loaner_rental_serial || null,
            date_sent_to_manufacturer: outService.date_sent_to_manufacturer || null,
            reason: outService.reason || null,
          }))
          .filter((item) => Object.values(item).some((val) => val !== null));

        for (const item of outServiceInfoData) {
          if (!item.ofs_id) {
            // If ofs_id is null, perform an insert
            await sequelize.queryInterface.bulkInsert(
              "out_of_service_info",
              [{
                ...item,
                aed_id,
                created_by: data.updated_by,
                created_at: currentTimestamp,
              }],
              { transaction }
            );
          } else {
            // If ofs_id exists, perform an update
            await sequelize.queryInterface.bulkUpdate(
              "out_of_service_info",
              {
                ...item,
                updated_by: data.updated_by,
                updated_at: currentTimestamp,
              },
              { ofs_id: item.ofs_id },
              { transaction }
            );
          }
        }
      }

      // Update battery_information table using updateOrInsertTable helper
      if (data.battery_info) {
        for (const battery of data.battery_info) {
          // console.log(battery);
          for (const batteryTypeKey of Object.keys(battery)) {
            const batteryData = battery[batteryTypeKey]
              .filter((batteryType) => batteryType)
              .map((batteryType) => ({
                battery_type: batteryType.battery_type || null,
                manufactured_date: batteryType.manufactured_date || null,
                installed_date: batteryType.date_installed || null,
                battery_lot: batteryType.battery_lot || null,
                battery_udi: batteryType.battery_udi || null,
                battery_expiration: batteryType.battery_expiration || null,
                v9_install_date: batteryType.v9_install || null,
                v9_expiration_date: batteryType.v9_expiration_date || null,
                spare: batteryType.spare ? 1 : 0,
                install_before_date: batteryType.install_before_date || null,
                battery_serial: batteryType.battery_serial || null,
                bi_id: batteryType.battery_id || null,
                battery_part_number: batteryType.battery_part_number || null,
                battery_type_id: batteryType.battery_type_id || null,
              }))
              .filter((item) =>
                Object.values(item).some((val) => val !== null)
              );

            for (const batteryEntry of batteryData) {
              await updateOrInsertTable(
                "battery_information",
                [batteryEntry],
                { battery_type: batteryTypeKey, bi_id: batteryEntry.bi_id },
                "BATTERY"
              );
            }
          }
        }
      }

      if (data.charge_pak_info) {
        const chargePakInfoData = data.charge_pak_info
          .filter((info) => info) // Filter out null/undefined entries
          .map((info) => ({
            battery_type: info.battery_type || null,
            manufactured_date: info.manufactured_date || null,
            installed_date: info.installed_date || null,
            battery_lot: info.battery_lot || null,
            battery_udi: info.charge_pak_udi,
            battery_type_id: info.charge_pak_type_id || null,
            battery_part_number: info.charge_pak_part || null,
            battery_expiration: info.battery_expiration || null,
            v9_install_date: info.v9_install_date || null,
            install_before_date: info.install_before_date || null,
            battery_serial: info.battery_serial || null,
            spare: info.spare ? 1 : 0,
            bi_id: info.battery_id || null, // Assuming each entry has its own battery_id
            charge_pak_pad_1_id: info.charge_pak_pad_1_id || null, // Use retrieved pad1_id
            charge_pak_pad_2_id: info.charge_pak_pad_2_id || null, // Use retrieved pad2_id
            pad_1_part: info.pad_1_part,
            pad_1_expiration: info.pad_1_expiration,
            pad_1_lot: info.pad_1_lot,
            pad_2_part: info.pad_2_part,
            pad_2_expiration: info.pad_2_expiration,
            pad_2_lot: info.pad_2_lot,
            pad_1_type_id: info.pad_1_type_id,
            pad_2_type_id: info.pad_2_type_id,
            pad_qty: info.pad_qty
          }))
          .filter((item) => Object.values(item).some((val) => val !== null)); // Only include items with at least one non-null value

        // Update the battery_information table for each entry in chargePakInfoData
        for (const chargePak of chargePakInfoData) {
          await updateOrInsertTable(
            "battery_information",
            [chargePak],
            {
              aed_id,
              battery_type: "charge_pak_info",
              bi_id: chargePak.bi_id,
            },
            "CHARGE_PAK"
          );
        }
      }

      // Update pads table
      if (data.pad_info) {
        for (const pad of data.pad_info) {
          if (pad) {
            console.log(pad.pad_id);
            const padData = {
              pad_lot: pad.pad_lot || null,
              pad_type: pad.pad_type || null,
              pediatric_key: pad.pediatric_key ? 1 : 0,
              pad_uid: pad.pad_udi || null,
              spare: pad.spare ? 1 : 0,
              pad_expiration: pad.pad_expiration || null,
              pad_id: pad.pad_id || null,
              pad_type_id: pad.pad_type_id,
              pad_part_number: pad.pad_part_number,
            };

            if (Object.values(padData).some((val) => val !== null)) {
              await updateOrInsertTable(
                "pads",
                [padData],
                {
                  pad_id: padData.pad_id,
                },
                "PADS"
              );
            }
          }
        }
      }

      // Update gateway_info table
      if (data.gateway_info) {
        const gatewayInfoData = data.gateway_info
          .filter((gateway) => gateway)
          .map((gateway) => ({
            expiry_date:gateway.expiry_date|| null,
            installed: gateway.installed || null,
            connected: gateway.connected || null,
            gateway_serial: gateway.gateway_serial || null,
            gateway_mac_address: gateway.gateway_mac_address || null,
            battery_install_date: gateway.battery_install_date || null,
            gateway_id: gateway.gateway_id || null  // Add this line to capture gateway_id
          }))
          .filter((item) => Object.values(item).some((val) => val !== null));

        for (const gateway of gatewayInfoData) {
          const { gateway_id, ...gatewayData } = gateway;
          if (!gateway_id) {
            // If gateway_id is null, perform an insert
            await sequelize.queryInterface.bulkInsert(
              "gateway_info",
              [{
                ...gatewayData,
                aed_id,
                created_by: data.updated_by,
                created_at: currentTimestamp,
              }],
              { transaction }
            );
          } else {
            // If gateway_id exists, perform an update
            await sequelize.queryInterface.bulkUpdate(
              "gateway_info",
              {
                ...gatewayData,
                updated_by: data.updated_by,
                updated_at: currentTimestamp,
              },
              { gateway_id: gateway_id },
              { transaction }
            );
          }
        }
      }

      // Update storage_information table
      if (data.storage_info) {
        const storageInfoData = data.storage_info
          .filter((storage) => storage)
          .map((storage) => ({
            storage_type_id: storage.storage_type || null,
            alarmed: storage.alarmed ? 1 : 0,
            alarm_status: storage.alarm_status ? 1 : 0,
            installed_date: storage.v9_Installed_Date || null,
            v9_expiration_date: storage.expiry_date || null,
          }))
          .filter((item) => Object.values(item).some((val) => val !== null));

        await updateOrInsertTable("storage_information", storageInfoData, {});
      }

      // Update service_information table
      if (data.service_info) {
        const serviceInfoData = data.service_info
          .filter((service) => service)
          .map((service) => ({
            service_type: service.service_type || null,
            service_date: service.service_date || null,
            serviced_by: service.serviced_by || null,
            service_notes: service.service_notes || null,
            service_company: service.service_company || null,
          }))
          .filter((item) => Object.values(item).some((val) => val !== null));

        await updateOrInsertTable("service_information", serviceInfoData, {});
      }
      return { success: true, message: "Aed updated successfully", aed_id };
    });
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message, aed_id };
  }
};

module.exports = { update_combine_model };
