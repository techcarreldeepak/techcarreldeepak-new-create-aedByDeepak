const { sequelize } = require("../../import");

const deleteItems = async (isDeletedArray, transaction) => {
  // Filter out items where id is null
  const validItems = isDeletedArray.filter(item => item.id !== null);

  try {
    for (const item of validItems) {
      if (item.type === "BATTERY") {
        // Delete battery based on battery ID
        await sequelize.query(
          `DELETE FROM battery_information 
           WHERE bi_id = :id`,
          { replacements: { id: item.id }, transaction }
        );
      } else if (item.type === "PAD") {
        await sequelize.query(
          `DELETE FROM pads 
           WHERE pad_id = :id`,
          { replacements: { id: item.id }, transaction }
        );

      } else if (item.type === "CHARGE_PAK") {
        await sequelize.query(
          `DELETE FROM battery_information 
           WHERE bi_id = :id`,
          { replacements: { id: item.id }, transaction }
        );

        // Delete related pads
        await sequelize.query(
          `DELETE FROM pads 
           WHERE pad_id IN (
             SELECT charge_pak_pad_1_id FROM battery_information WHERE bi_id = :id
           ) OR pad_id IN (
             SELECT charge_pak_pad_2_id FROM battery_information WHERE bi_id = :id
           )`,
          { replacements: { id: item.id }, transaction }
        );
      }
    }
  } catch (error) {
    console.error("Error deleting items:", error);
    throw new Error("Error occurred while deleting items");
  }
};

module.exports = {
  deleteItems,
};
