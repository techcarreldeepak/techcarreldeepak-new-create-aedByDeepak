const { sequelize } = require("../../import");

const get_site_combine_model = async (
  account_id,
  page = 1,
  pageSize = 10,
  searchQuery
) => {
  try {
    if (!account_id) {
      return { 
        success: false, 
        message: "Account ID is required" 
      };
    }
    const offset = (page - 1) * pageSize;
    const searchFilter = searchQuery
      ? `AND (
            LOWER(db.AED_brands) LIKE LOWER(:search)
            OR LOWER(dm.model_name) LIKE LOWER(:search)
            OR LOWER(a.serial) LIKE LOWER(:search)
            OR LOWER(ai.account_name) LIKE LOWER(:search)
            OR LOWER(COALESCE(asi.account_site_name, 'Pending')) LIKE LOWER(:search)
         )`
      : "";

    // First, get all sites for the account, including a special entry for pending
    const sitesQuery = `
      SELECT 
        account_site_info_id,
        account_site_name
      FROM account_site_info_tbls
      WHERE account_id = :account_id
      UNION ALL
      SELECT 
        0 as account_site_info_id,
        'Pending' as account_site_name
      WHERE EXISTS (
        SELECT 1 FROM aed_data 
        WHERE account_id = :account_id AND site_id = 0
      )
      ORDER BY account_site_name
    `;

    const [allSites] = await sequelize.query(sitesQuery, {
      replacements: { account_id }
    });

    // Get all site IDs, including 0 for pending
    const siteIds = allSites.map(site => site.account_site_info_id);

    // Get AED data for all sites
    const aedDataQuery = `
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
              WHEN a.site_id = 0 THEN 'Pending'
              ELSE asi.account_site_name 
          END AS site_name,
          COUNT(*) OVER() AS total_count
      FROM aed_data a
      LEFT JOIN account_information_tbls ai ON a.account_id = ai.account_id
      LEFT JOIN dropdown_aed_brands_tbls db ON a.brand_id = db.id
      LEFT JOIN dropdown_aed_model_tbls dm ON a.model_id = dm.id
      LEFT JOIN account_site_info_tbls asi ON a.site_id = asi.account_site_info_id
      WHERE a.account_id = :account_id
      AND (a.site_id IN (:siteIds) OR a.site_id = 0)
      ${searchFilter}
      LIMIT :limit OFFSET :offset
    `;

    const replacements = {
      account_id,
      siteIds,
      limit: parseInt(pageSize, 10),
      offset: parseInt(offset, 10),
      search: searchQuery ? `%${searchQuery}%` : undefined
    };

    const [aedData] = await sequelize.query(aedDataQuery, {
      replacements
    });

    // Rest of the related data queries remain the same
    let batteryInfo = [], gatewayInfo = [], storageInfo = [], chargePakInfo = [], padsInfo = [];
    
    if (aedData.length > 0) {
      const aedIds = aedData.map((aed) => aed.aed_id);
      const relatedDataQueries = {
        batteryInfo: `
          SELECT aed_id, spare, bi_id as battery_id, battery_expiration, battery_type, v9_expiration_date 
          FROM battery_information 
          WHERE aed_id IN (:aedIds) AND battery_type IS NOT NULL
        `,
        gatewayInfo: `
          SELECT aed_id, expiry_date, gateway_id   
          FROM gateway_info 
          WHERE aed_id IN (:aedIds)
        `,
        storageInfo: `
          SELECT 
            si.aed_id,
            s_i_id,
            si.v9_expiration_date
          FROM storage_information si
          LEFT JOIN dropdown_storage_info_tbls dsit ON si.storage_type_id = dsit.storage_info_id
          WHERE si.aed_id IN (:aedIds)
        `,
        chargePakInfo: `
          SELECT bi.aed_id, 
            pad1.pad_expiration AS pad_1_expiration, 
            pad2.pad_expiration AS pad_2_expiration,
            pad1.pad_type AS pad_1_type,
            pad2.pad_type AS pad_2_type,
            pad1.pad_id AS pad_1_id,
            pad2.pad_id AS pad_2_id
          FROM battery_information bi
          LEFT JOIN pads pad1 ON bi.charge_pak_pad_1_id = pad1.pad_id
          LEFT JOIN pads pad2 ON bi.charge_pak_pad_2_id = pad2.pad_id
          WHERE bi.aed_id IN (:aedIds) AND bi.battery_type = 'charge_pak_info'
        `,
        padsInfo: `
          SELECT pad_id, spare, pad_expiration, pad_type, aed_id 
          FROM pads 
          WHERE aed_id IN (:aedIds)
        `,
      };

      [
        [batteryInfo],
        [gatewayInfo],
        [storageInfo],
        [chargePakInfo],
        [padsInfo],
      ] = await Promise.all(
        Object.values(relatedDataQueries).map((query) =>
          sequelize.query(query, { replacements: { aedIds } })
        )
      );
    }

    // Group related data by AED ID (same as before)
    const groupByAedId = (data) =>
      data.reduce((acc, item) => {
        const aed_id = item.aed_id;
        acc[aed_id] = acc[aed_id] || [];
        acc[aed_id].push(item);
        return acc;
      }, {});

    const batteryInfoByAed = groupByAedId(batteryInfo);
    const chargePakInfoByAed = groupByAedId(chargePakInfo);
    const padsInfoByAed = groupByAedId(padsInfo);

    // Create final site data structure including sites with no AEDs and pending site
    const siteData = allSites.map(site => {
      const siteAeds = aedData.filter(aed => 
        (site.account_site_info_id === 0 && aed.site_id === 0) || 
        (aed.site_id === site.account_site_info_id)
      );
      
      return {
        siteName: site.account_site_name,
        aedData: siteAeds.map(aed => {
          const aedId = aed.aed_id;
          const chargePakPads = (chargePakInfoByAed[aedId] || []).flatMap((c) => [
            {
              expiration: c.pad_1_expiration,
              type: c.pad_1_type,
              id: c.pad_1_id,
            },
            {
              expiration: c.pad_2_expiration,
              type: c.pad_2_type,
              id: c.pad_2_id,
            },
          ]);

          const regularPads = (padsInfoByAed[aedId] || []).map((p) => ({
            expiration: p.pad_expiration,
            type: p.pad_type,
            id: p.pad_id,
          }));

          return {
            ...aed,
            battery_expiration: [
              ...(batteryInfoByAed[aedId] || []).map(battery => ({
                ...battery,
                type: "battery",
              })),
              ...(gatewayInfo.filter(g => g.aed_id === aedId) || []).map(gateway => ({
                ...gateway,
                type: "gateway",
              })),
              ...(storageInfo.filter(s => s.aed_id === aedId) || []).map(storage => ({
                ...storage,
                type: "storage",
              })),
            ].filter(Boolean),
            pad_expiration: [
              ...chargePakPads.filter(value => value !== null),
              ...regularPads.filter(value => value !== null),
            ],
          };
        }),
      };
    });

    return {
      success: true,
      page,
      pageSize,
      count: aedData.length > 0 ? aedData[0].total_count : 0,
      data: siteData,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
};

module.exports = { get_site_combine_model };