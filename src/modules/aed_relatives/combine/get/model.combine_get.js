const { sequelize } = require("../../import");

const get_combine_model = async (
  aed_id,
  page = 1,
  pageSize = 10,
  is_listing,
  searchQuery
) => {
  try {
    const offset = (page - 1) * pageSize;
    const searchFilter = searchQuery
      ? ` AND (
            LOWER(db.AED_brands) LIKE LOWER(:search)
            OR LOWER(dm.model_name) LIKE LOWER(:search)
            OR LOWER(a.serial) LIKE LOWER(:search)
            OR LOWER(ai.account_name) LIKE LOWER(:search)
            OR LOWER(asi.account_site_name) LIKE LOWER(:search)
         )`
      : "";
    if (is_listing) {
      const query = `
  SELECT 
      a.aed_id, 
      a.account_id, 
      a.site_id, 
      a.brand_id, 
      a.model_id, 
      a.serial, 
      a.last_check, 
      a.last_service,
      ai.account_name,
      db.AED_brands AS brand_name,
      dm.model_name,
      CASE 
          WHEN asi.account_site_info_id = 0 OR asi.account_site_info_id IS NULL THEN 'Pending'
          ELSE asi.account_site_name 
      END AS site_name,
      COUNT(*) OVER() AS total_count
  FROM aed_data a
  LEFT JOIN account_information_tbls ai ON a.account_id = ai.account_id
  LEFT JOIN dropdown_aed_sub_model_tbls si ON a.sub_model_id = si.id
  LEFT JOIN dropdown_aed_brands_tbls db ON a.brand_id = db.id
  LEFT JOIN dropdown_aed_model_tbls dm ON a.model_id = dm.id
  LEFT JOIN account_site_info_tbls asi ON a.site_id = asi.account_site_info_id
  WHERE 1=1
      ${searchFilter}
  LIMIT :limit OFFSET :offset;
`;

      const results = await sequelize.query(query, {
        replacements: {
          limit: Number(pageSize),
          offset: Number(offset),
          search: `%${searchQuery}%`,
        }, // Ensure numeric values
        type: sequelize.QueryTypes.SELECT,
      });

      if (results.length === 0) {
        return {
          success: true,
          page,
          pageSize: pageSize,
          count: 0,
          data: [],
        };
      }

      const totalCount = results[0].total_count;

      return {
        success: true,
        // page,
        // pageSize: limit,
        data: {
          countResult: { totalCount },
          resultData: results,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };
    } else {
      const aedDataQuery = `
  SELECT 
      a.*,
      ai.account_name,
      si.sub_model_name,
      dm.model_partnumber AS part_number, 
      db.AED_brands AS brand_name,
      dm.model_name,
      dm.image_file_name,
      CASE 
          WHEN asi.account_site_info_id = 0 OR asi.account_site_info_id IS NULL THEN 'Pending'
          ELSE asi.account_site_name 
      END AS site_name,
      COUNT(*) OVER() AS total_count
  FROM aed_data a
  LEFT JOIN account_information_tbls ai ON a.account_id = ai.account_id
  LEFT JOIN dropdown_aed_sub_model_tbls si ON a.sub_model_id = si.id
  LEFT JOIN dropdown_aed_brands_tbls db ON a.brand_id = db.id
  LEFT JOIN dropdown_aed_model_tbls dm ON a.model_id = dm.id
  LEFT JOIN account_site_info_tbls asi ON a.site_id = asi.account_site_info_id
  ${aed_id ? "WHERE a.aed_id = :aed_id" : ""}
   ${searchFilter}
  LIMIT :limit OFFSET :offset;
  
  
  `;

      const replacements = {
        aed_id,
        limit: parseInt(pageSize, 10),
        offset: parseInt(offset, 10),
        search: `%${searchQuery}%`,
      };

      const [aedData] = await sequelize.query(aedDataQuery, {
        replacements: aed_id
          ? replacements
          : { limit: replacements.limit, offset: replacements.offset },
      });

      // Early return if no AED data is found
      if (!aedData.length) {
        return { success: false, message: "No AED data found" };
      }

      // Fetch all related data for the AEDs in a single set of batched queries
      const aedIds = aedData.map((aed) => aed.aed_id);
      const relatedDataQueries = {
        customFields: `SELECT * FROM custom_fields WHERE aed_id IN (:aedIds)`,
        rmsInfo: `SELECT * FROM rms_info WHERE aed_id IN (:aedIds)`,
        outOfServiceInfo: `SELECT * FROM out_of_service_info WHERE aed_id IN (:aedIds)`,
        batteryInfo: `SELECT * FROM battery_information WHERE aed_id IN (:aedIds) AND battery_type IS NOT NULL;`,
        padsInfo: `SELECT * FROM pads WHERE aed_id IN (:aedIds)`,
        gatewayInfo: `SELECT * FROM gateway_info WHERE aed_id IN (:aedIds)`,
        storageInfo: `SELECT 
      si.*,
      dsit.storage_info_name 
  FROM 
      storage_information si
  LEFT JOIN 
      dropdown_storage_info_tbls dsit 
  ON 
      si.storage_type_id = dsit.storage_info_id
  WHERE 
      si.aed_id IN (:aedIds);`,
        chargePakInfo: `
         SELECT bi.*, 
         pad1.pad_id AS charge_pak_pad_1_id, 
         pad2.pad_id AS charge_pak_pad_2_id,
         pad1.pad_type_id AS pad_1_type_id, 
         pad2.pad_type_id AS pad_2_type_id,
         pad1.pad_type AS pad1_type, 
         pad2.pad_type AS pad2_type, 
         pad1.pad_part_number AS pad1_part_number, 
         pad2.pad_part_number AS pad2_part_number,
         pad1.aed_id AS pad_1_aed_id, 
         pad2.aed_id AS pad_2_aed_id,
         pad1.pad_lot AS pad_1_lot, 
         pad2.pad_lot AS pad_2_lot,
         pad1.pediatric_key AS pad_1_pediatric_key,
         pad2.pediatric_key AS pad_2_pediatric_key,
         pad1.pad_uid AS pad_1_uid, 
         pad2.pad_uid AS pad_2_uid,
         pad1.spare AS pad_1_spare, 
         pad2.spare AS pad_2_spare,
         pad1.pad_expiration AS pad_1_expiration, 
         pad2.pad_expiration AS pad_2_expiration
  FROM battery_information bi
  LEFT JOIN pads pad1 ON bi.charge_pak_pad_1_id = pad1.pad_id
  LEFT JOIN pads pad2 ON bi.charge_pak_pad_2_id = pad2.pad_id
  WHERE bi.aed_id IN (:aedIds) 
    AND bi.battery_type = 'charge_pak_info'
        `,
      };

      const [
        [customFields],
        [rmsInfo],
        [outOfServiceInfo],
        [batteryInfo],
        [padsInfo],
        [gatewayInfo],
        [storageInfo],
        [chargePakInfo],
      ] = await Promise.all(
        Object.values(relatedDataQueries).map((query) =>
          sequelize.query(query, { replacements: { aedIds } })
        )
      );

      // Group related data by aed_id for efficient access
      const groupByAedId = (data) =>
        data.reduce((acc, item) => {
          const { aed_id } = item;
          acc[aed_id] = acc[aed_id] || [];
          acc[aed_id].push(item);
          return acc;
        }, {});

      const customFieldsByAed = groupByAedId(customFields);
      const rmsInfoByAed = groupByAedId(rmsInfo);
      const outOfServiceInfoByAed = groupByAedId(outOfServiceInfo);
      const batteryInfoByAed = groupByAedId(batteryInfo);
      const padsInfoByAed = groupByAedId(padsInfo);
      const gatewayInfoByAed = groupByAedId(gatewayInfo);
      const storageInfoByAed = groupByAedId(storageInfo);
      const chargePakInfoByAed = groupByAedId(chargePakInfo);

      // Compile the results using pre-fetched related data
      const results = aedData.map((aed) => {
        const aedId = aed.aed_id;
        const filteredBatteryInfo = (batteryInfoByAed[aedId] || []).filter(
          (battery) => battery.battery_type !== "charge_pak_info"
        );

        // console.log(filteredBatteryInfo)
        const chargePakEntries = chargePakInfoByAed[aedId] || [];
        // console.log(batteryInfo?.[0].battery_type)
        return {
          aed,
          customFields: (customFieldsByAed[aedId] || []).filter(
            (field) => field.label !== null || field.val !== null
          ),
          rmsInfo: rmsInfoByAed[aedId] || [],
          outOfServiceInfo: outOfServiceInfoByAed[aedId] || [],
          batteryInfo: filteredBatteryInfo,
          padsInfo: padsInfoByAed[aedId] || [],
          gatewayInfo: gatewayInfoByAed[aedId] || [],
          storageInfo: storageInfoByAed[aedId] || [],
          chargePakInfo:
            chargePakEntries?.[0]?.battery_type == null
              ? []
              : chargePakEntries.map((entry) => ({
                  ...entry,
                  pad1Info: entry.charge_pak_pad_1_id
                    ? (padsInfoByAed[entry.charge_pak_pad_1_id] || [])[0]
                    : null,
                  pad2Info: entry.charge_pak_pad_2_id
                    ? (padsInfoByAed[entry.charge_pak_pad_2_id] || [])[0]
                    : null,
                })),
        };
      });

      // Return success response with compiled data
      return {
        success: true,
        page,
        pageSize,
        count: aedData[0].total_count,
        data: results,
      };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
};

module.exports = { get_combine_model };
