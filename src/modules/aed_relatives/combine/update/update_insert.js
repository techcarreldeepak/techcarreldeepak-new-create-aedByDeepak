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
          pad_type_id: pad.pad_1_type_id,
          pad_part_number: pad.pad_1_part,
          aed_id,
          pad_expiration: item.pad_1_expiration,
          pad_lot: item.pad_1_lot,
          pad_type: "CHARGE_PAK",
          created_by: data.updated_by,
          created_at: currentTimestamp,
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
          pad_type_id: pad.pad_2_type_id,
          pad_part_number: pad.pad_2_part,
          aed_id,
          pad_expiration: item.pad_2_expiration,
          pad_lot: item.pad_2_lot,
          pad_type: "CHARGE_PAK",
          created_by: data.updated_by,
          created_at: new Date(),
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
      if (item.pad_qty === 1) {
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
        battery_expiration: item.battery_expiration || null,
        v9_Install_date: item.v9_Install_date || null,
        install_before_date: item.install_before_date || null,
        battery_serial: item.battery_serial || null,
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

module.exports = {
  updateOrInsertTable
}