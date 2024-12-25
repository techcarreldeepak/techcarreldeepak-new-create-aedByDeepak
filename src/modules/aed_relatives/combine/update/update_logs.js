const { sequelize } = require("../../import");

const logAedUpdates = async (aedId, updatedBy, newData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const currentTime = new Date();
    
    // Define mapping of keys to relation types
    const relationTypeMapping = {
      battery_level: "BATTERY",
      pad_type: "ADULT", // or "PEDIATRIC" based on specific logic
      status: "OUTOFSERVICE",
      gateway_id: "GATEWAY",
      rms_status: "RMS",
      storage_location: "STORAGE",
      custom_field: "CUSTOM"
    };

    // Step 1: Fetch the most recent log entry for the given aed_id
    const oldDataResult = await sequelize.query(`
      SELECT new_data
      FROM aed_updation_log
      WHERE aed_id = :aedId
      ORDER BY created_at DESC
      LIMIT 1;
    `, {
      replacements: { aedId },
      type: sequelize.QueryTypes.SELECT,
      transaction
    });

    // Parse old data or use empty object if no previous log exists
    const oldData = oldDataResult.length > 0 ? 
      (typeof oldDataResult[0].new_data === 'string' ? 
        JSON.parse(oldDataResult[0].new_data) : oldDataResult[0].new_data) : {};

    // Step 2: Compare old and new data to identify changes
    const changes = {};
    
    for (const key of Object.keys(newData)) {
      // Only track changes if values are different
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = {
          old_value: oldData[key] ?? null,
          new_value: newData[key],
          relation_type: relationTypeMapping[key] || "GENERAL"
        };
      }
    }

    // Step 3: Insert update log if changes exist
    if (Object.keys(changes).length > 0) {
      const query = `
        INSERT INTO aed_updation_log 
        (aed_id, changes, new_data, created_at, created_by,old_data)
        VALUES (:aedId, :changes, :newData, :createdAt, :createdBy,:oldData)
      `;

      await sequelize.query(query, {
        replacements: {
          aedId,
          changes: JSON.stringify(changes),
          newData: JSON.stringify(newData),
          oldData: JSON.stringify(oldData),
          createdAt: currentTime,
          createdBy: updatedBy
        },
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
    }

    await transaction.commit();
    return changes; // Return changes for debugging/verification
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = { logAedUpdates };